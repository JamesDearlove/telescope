import { formatRelative, parse } from "date-fns";
import { localStorageKeys } from "../state/model";

const BASE_URL = "https://api.todoist.com/rest/v2";

export interface TodoistItem {
  id: string;
  project_id: string;
  section_id: string;
  content: string;
  description: string;
  is_completed: boolean;
  labels: string[];
  parent_id: string | null;
  order: number;
  priority: 1 | 2 | 3 | 4 | undefined;
  due: TodoistDue | null;
  url: string;
  comment_count: number;
  assignee_id: string | null;
  assigner_id: string | null;
  creator_id: string;
  // created_at:
}

export interface TodoistDue {
  string: string;
  date: string;
  is_recurring: boolean;
  datetime?: string;
  timezone?: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: number;
  parent_id: string | null;
  order: number;
  comment_count: number;
  is_shared: boolean;
  is_favourite: boolean;
  is_inbox_project: boolean;
  is_team_inbox: boolean;
  url: string;
}

/**
 * Get the Todoist API key from local storage.
 * Throws an error if there is no API key.
 * @returns The stored Todoist API key.
 */
const getApiKey = (): string => {
  // TODO: Refactor this to not interface with LocalStorage directly.
  const apiKey = localStorage.getItem(localStorageKeys.todoistApiKey);
  if (!apiKey) {
    throw new Error("No Todoist API key.");
  }
  return apiKey;
};

/**
 * Send a GET request to the Todoist REST API.
 * @param endpoint Endpoint to send request to.
 * @param params (Optional) Any params for the request.
 * @returns The data if the request was successful.
 */
const getData = async (endpoint: string) => {
  const response = await fetch(`${BASE_URL}/${endpoint}?`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  if (response.status === 200) {
    return await response.json();
  } else if (response.status === 204) {
    // No data to return.
    return {};
  } else {
    throw new Error(response.statusText);
  }
};

const postData = async (endpoint: string, content?: any) => {
  const response = await fetch(`${BASE_URL}/${endpoint}?`, {
    method: "POST",
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  if (response.status === 200 || response.status === 204) {
    return await response.json();
  } else {
    throw Error(response.statusText);
  }
};

/**
 * Get all the tasks based on the user's current filter.
 * @returns Array of TodoistItems.
 */
export const getTasks = async (): Promise<TodoistItem[] | undefined> => {
  const filter =
    localStorage.getItem(localStorageKeys.todoistFilter) ||
    "(today | overdue) & !assigned to: others";

  return getData(`tasks?filter=${filter}`);
};

/**
 * Get all the user's projects.
 * @returns Array of TodoistProjects.
 */
export const getProjects = async (): Promise<TodoistProject[] | undefined> => {
  return getData("projects");
};

/**
 * Closes a task that is currently open.
 * @param taskId The task to close
 */
export const closeTask = async (taskId: string) => {
  return postData(`tasks/${taskId}/close`);
};

/**
 * Converts the TodoistDue to a friendly date.
 * @param due The TodoistDue object.
 * @returns A friendly date if set, otherwise an empty string.
 */
export const relativeDateTime = (due: TodoistDue): string => {
  const dueDateTime = due.datetime
    ? parse(due.datetime, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date())
    : undefined;

  if (dueDateTime) {
    return formatRelative(dueDateTime, new Date());
  } else {
    const dueDate = due.date
      ? parse(due.date, "yyyy-MM-dd", new Date())
      : undefined;

    if (dueDate) {
      return formatRelative(dueDate, new Date()).split(" at")[0];
    } else {
      return "";
    }
  }
};
