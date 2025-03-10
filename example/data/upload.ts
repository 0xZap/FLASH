import { v4 as uuidv4 } from 'uuid';
import { NilDB, Node } from '@0xzap/flash';
import {
    loadFile,
    createChunks,
    generateEmbeddingsHuggingface,
    encryptFloatList,
    encryptStringList
} from '@0xzap/flash';
import { nilql } from '@nillion/nilql';
import * as fs from 'fs';
import * as path from 'path';

const JSON_FILE = "examples/nildb_config.json";
const SECRET_KEY = "YOUR_SECRET_KEY"; // Update with your SecretVault (nilDB) Secret Key
const FILE_PATH = 'examples/data/cities.txt';

async function main() {
    // Load NilDB from JSON file if it exists
    if (!fs.existsSync(JSON_FILE)) {
        console.error("Error: NilDB configuration file not found.");
        process.exit(1);
    }

    console.log("Loading NilDB configuration from file...");
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    const nodes: Node[] = data.nodes.map((nodeData: any) => ({
        url: nodeData.url,
        nodeId: nodeData.node_id,
        org: nodeData.org,
        bearerToken: null,
        schemaId: nodeData.schema_id
    }));

    const nilDB = new NilDB(nodes);
    nilDB.generateJwt(SECRET_KEY, 3600);

    console.log("NilDB instance:", nilDB);
    console.log();

    // Initialize secret keys for different modes of operation
    const numNodes = nilDB.nodes.length;
    const additiveKey = nilql.ClusterKey.generate(
        { nodes: Array(numNodes).fill({}) },
        { sum: true }
    );
    const xorKey = nilql.ClusterKey.generate(
        { nodes: Array(numNodes).fill({}) },
        { store: true }
    );

    // Load and process input file
    const paragraphs = await loadFile(FILE_PATH);
    const chunks = createChunks(paragraphs, 50, 10);

    // Generate embeddings
    console.log('Generating embeddings...');
    const embeddings = await generateEmbeddingsHuggingface(chunks);
    console.log('Embeddings generated!');

    // Encrypt chunks and embeddings
    const chunksShares = chunks.map(chunk => encryptStringList(xorKey, [chunk]));
    const embeddingsShares = embeddings.map(embedding => encryptFloatList(additiveKey, embedding));

    // Upload encrypted data to nilDB
    console.log('Uploading data...');
    await nilDB.uploadData(embeddingsShares, chunksShares);
    console.log('Data upload complete!');
}

main().catch(console.error);
