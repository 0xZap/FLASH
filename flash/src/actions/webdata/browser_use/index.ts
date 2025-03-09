import { RunTaskAction } from "./run_task";
import { 
  StopTaskAction, 
  PauseTaskAction, 
  ResumeTaskAction 
} from "./control_task";
import { 
  GetTaskAction, 
  GetTaskStatusAction, 
  GetTaskMediaAction 
} from "./get_task";
import { ListTasksAction } from "./list_tasks";
import { 
  CheckBalanceAction, 
  GetUserInfoAction, 
  PingAction 
} from "./utils_endpoints";

/**
 * All browser use tools
 */
export const BROWSER_USE_TOOLS = [
  // Task creation
  new RunTaskAction(),
  
  // Task control
  new StopTaskAction(),
  new PauseTaskAction(),
  new ResumeTaskAction(),
  
  // Task information
  new GetTaskAction(),
  new GetTaskStatusAction(),
  new GetTaskMediaAction(),
  new ListTasksAction(),
  
  // Account and utility endpoints
  new CheckBalanceAction(),
  new GetUserInfoAction(),
  new PingAction(),
]; 