import { TasksStateType } from '../App'
import { v1 } from 'uuid'
import { AddTodolistActionType, RemoveTodolistActionType, SetTodosType } from './todolists-reducer'
import {
  TaskPriorities,
  TaskStatuses,
  TaskType,
  UpdateTaskModelType,
  todolistsAPI,
} from '../api/todolists-api'
import { Dispatch } from 'redux'
import { AppRootStateType } from './store'

export type RemoveTaskActionType = {
  type: 'REMOVE-TASK'
  todolistId: string
  taskId: string
}

export type AddTaskActionType = {
  type: 'ADD-TASK'
  task: TaskType
}

export type ChangeTaskStatusActionType = {
  type: 'CHANGE-TASK-STATUS'
  todolistId: string
  taskId: string
  status: TaskStatuses
}

export type ChangeTaskTitleActionType = {
  type: 'CHANGE-TASK-TITLE'
  todolistId: string
  taskId: string
  title: string
}

export type SetTasksType = ReturnType<typeof setTasksAC>

type ActionsType =
  | RemoveTaskActionType
  | AddTaskActionType
  | ChangeTaskStatusActionType
  | ChangeTaskTitleActionType
  | AddTodolistActionType
  | RemoveTodolistActionType
  | SetTodosType
  | SetTasksType

const initialState: TasksStateType = {}

export const tasksReducer = (
  state: TasksStateType = initialState,
  action: ActionsType
): TasksStateType => {
  switch (action.type) {
    case 'SET-TASKS': {
      return {
        ...state,
        [action.todolistId]: action.tasks,
      }
    }
    case 'SET-TODOLISTS': {
      const copyState = { ...state }
      action.todos.forEach((el) => {
        copyState[el.id] = []
      })
      return copyState
    }
    case 'REMOVE-TASK': {
      const stateCopy = { ...state }
      const tasks = stateCopy[action.todolistId]
      const newTasks = tasks.filter((t) => t.id !== action.taskId)
      stateCopy[action.todolistId] = newTasks
      return stateCopy
    }
    case 'ADD-TASK': {
      return {
        ...state,
        [action.task.todoListId]: [action.task, ...state[action.task.todoListId]],
      }
    }
    case 'CHANGE-TASK-STATUS': {
      let todolistTasks = state[action.todolistId]
      let newTasksArray = todolistTasks.map((t) =>
        t.id === action.taskId ? { ...t, status: action.status } : t
      )

      state[action.todolistId] = newTasksArray
      return { ...state }
    }
    case 'CHANGE-TASK-TITLE': {
      let todolistTasks = state[action.todolistId]
      // найдём нужную таску:
      let newTasksArray = todolistTasks.map((t) =>
        t.id === action.taskId ? { ...t, title: action.title } : t
      )

      state[action.todolistId] = newTasksArray
      return { ...state }
    }
    case 'ADD-TODOLIST': {
      return {
        ...state,
        [action.todolistId]: [],
      }
    }
    case 'REMOVE-TODOLIST': {
      const copyState = { ...state }
      delete copyState[action.id]
      return copyState
    }
    default:
      return state
  }
}

export const removeTaskAC = (taskId: string, todolistId: string): RemoveTaskActionType => {
  return { type: 'REMOVE-TASK', taskId: taskId, todolistId: todolistId }
}
export const addTaskAC = (task: TaskType): AddTaskActionType => {
  return { type: 'ADD-TASK', task }
}
export const changeTaskStatusAC = (
  taskId: string,
  status: TaskStatuses,
  todolistId: string
): ChangeTaskStatusActionType => {
  return { type: 'CHANGE-TASK-STATUS', status, todolistId, taskId }
}
export const changeTaskTitleAC = (
  taskId: string,
  title: string,
  todolistId: string
): ChangeTaskTitleActionType => {
  return { type: 'CHANGE-TASK-TITLE', title, todolistId, taskId }
}

export const setTasksAC = (todolistId: string, tasks: TaskType[]) =>
  ({
    type: 'SET-TASKS',
    tasks,
    todolistId,
  } as const)

export const getTasksTC = (todolistId: string) => (dispatch: Dispatch) => {
  todolistsAPI.getTasks(todolistId).then((res) => {
    dispatch(setTasksAC(todolistId, res.data.items))
  })
}

export const deleteTasksTC = (todolistId: string, taskId: string) => (dispatch: Dispatch) => {
  todolistsAPI.deleteTask(todolistId, taskId).then((res) => {
    dispatch(removeTaskAC(taskId, todolistId))
  })
}

export const addTasksTC = (todolistId: string, title: string) => (dispatch: Dispatch) => {
  todolistsAPI.createTask(todolistId, title).then((res) => {
    dispatch(addTaskAC(res.data.data.item))
  })
}

export const updateTasksTC =
  (todolistId: string, taskId: string, status: TaskStatuses) =>
  (dispatch: Dispatch, getState: () => AppRootStateType) => {
    const tasks = getState().tasks
    const task = tasks[todolistId].find((el) => el.id === taskId)
    if (task) {
      const model: UpdateTaskModelType = {
        title: task.title,
        startDate: task.startDate,
        deadline: task.deadline,
        description: task.description,
        priority: task.priority,
        status,
      }
      todolistsAPI.updateTask(todolistId, taskId, model).then((res) => {
        dispatch(changeTaskStatusAC(taskId, status, todolistId))
      })
    }
  }
