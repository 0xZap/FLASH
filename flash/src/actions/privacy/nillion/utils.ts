/**
 * Utility functions for nilRAG.
 */

import { nilql } from '@nillion/nilql';
// import { pipeline } from '@xenova/transformers';

/**
 * Load text from a file and split it into paragraphs.
 */
export async function loadFile(filePath: string): Promise<string[]> {
    const text = await Bun.file(filePath).text();
    const paragraphs = text.split('\n\n');
    return paragraphs.filter(para => para.trim()).map(para => para.trim());
}

/**
 * Split paragraphs into overlapping chunks of words.
 */
export function createChunks(
    paragraphs: string[],
    chunkSize: number = 500,
    overlap: number = 100
): string[] {
    const chunks: string[] = [];
    for (const para of paragraphs) {
        const words = para.split(' ');
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            chunks.push(chunk);
        }
    }
    return chunks;
}

/**
 * Generate embeddings for text using a HuggingFace sentence transformer model.
 */
export async function generateEmbeddingsHuggingface(
    chunksOrQuery: string | string[],
    modelName: string = 'sentence-transformers/all-MiniLM-L6-v2'
): Promise<number[][]> {
    // const extractor = await pipeline('feature-extraction', modelName);
    // 
    // Handle both single string and array of strings
    const inputs = Array.isArray(chunksOrQuery) ? chunksOrQuery : [chunksOrQuery];
    
    // Process each input and extract embeddings
    const embeddings = await Promise.all(
        inputs.map(async (text) => {
            // const output = await extractor(text, { pooling: 'mean' });
            // return Array.from(output.data);
            return [];
        })
    );
    
    return embeddings as number[][];
}

/**
 * Calculate Euclidean distance between two vectors.
 */
export function euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
        a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
}

/**
 * Find chunks closest to a query embedding using Euclidean distance.
 */
export function findClosestChunks(
    queryEmbedding: number[],
    chunks: string[],
    embeddings: number[][],
    topK: number = 2
): [string, number][] {
    const distances = embeddings.map(emb => euclideanDistance(queryEmbedding, emb));
    const sortedIndices = Array.from(distances.keys())
        .sort((a, b) => distances[a] - distances[b]);
    return sortedIndices
        .slice(0, topK)
        .map(idx => [chunks[idx], distances[idx]]);
}

/**
 * Groups shares by their ID and applies a transform function to each share.
 */
export function groupSharesById<T, R>(
    sharesPerParty: T[][],
    transformShareFn: (share: T) => R
): Record<string, R[]> {
    const sharesById: Record<string, R[]> = {};
    for (const partyShares of sharesPerParty) {
        for (const share of partyShares) {
            const shareId = (share as any)._id;
            if (!sharesById[shareId]) {
                sharesById[shareId] = [];
            }
            sharesById[shareId].push(transformShareFn(share));
        }
    }
    return sharesById;
}

const PRECISION = 7;
const SCALING_FACTOR = Math.pow(10, PRECISION);

/**
 * Convert a floating-point value to fixed-point representation.
 */
export function toFixedPoint(value: number): number {
    return Math.round(value * SCALING_FACTOR);
}

/**
 * Convert a fixed-point value back to floating-point.
 */
export function fromFixedPoint(value: number): number {
    return value / SCALING_FACTOR;
}

/**
 * Encrypt a list of floats using a secret key.
 */
export function encryptFloatList(sk: any, lst: number[]): any[] {
    return lst.map(l => nilql.encrypt(sk, toFixedPoint(l)));
}

/**
 * Decrypt a list of encrypted fixed-point values to floats.
 */
export async function decryptFloatList(sk: any, lst: any[]): Promise<number[]> {
    return Promise.all(lst.map(async l => fromFixedPoint(Number(await nilql.decrypt(sk, l)))));
}

/**
 * Encrypt a list of strings using a secret key.
 */
export function encryptStringList(sk: any, lst: string[]): any[] {
    return lst.map(l => nilql.encrypt(sk, l));
}

/**
 * Decrypt a list of encrypted strings.
 */
export async function decryptStringList(sk: any, lst: any[]): Promise<string[]> {
    return (await Promise.all(lst.map(l => nilql.decrypt(sk, l)))).map(String);
}
