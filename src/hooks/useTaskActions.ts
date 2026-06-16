import { useCallback } from 'react';
import { useTaskDetailStore } from '../stores/taskDetailStore.js';
import { useTaskStore } from '../stores/taskStore.js';

export function useTaskActions() {
  const {
    createIssue,
    updateIssue,
    deleteIssue,
    assignEditor,
    assignReviewer,
    submitReview,
    submitRework,
    archiveTask,
  } = useTaskDetailStore();

  const { refreshAll } = useTaskStore();

  const createIssueWithRefresh = useCallback(async (taskId: string, data: any) => {
    await createIssue(taskId, data);
    await refreshAll();
  }, [createIssue, refreshAll]);

  const updateIssueWithRefresh = useCallback(async (taskId: string, issueId: string, data: any) => {
    await updateIssue(taskId, issueId, data);
    await refreshAll();
  }, [updateIssue, refreshAll]);

  const deleteIssueWithRefresh = useCallback(async (taskId: string, issueId: string) => {
    await deleteIssue(taskId, issueId);
    await refreshAll();
  }, [deleteIssue, refreshAll]);

  const assignEditorWithRefresh = useCallback(async (taskId: string, editorId: string) => {
    await assignEditor(taskId, editorId);
    await refreshAll();
  }, [assignEditor, refreshAll]);

  const assignReviewerWithRefresh = useCallback(async (taskId: string, reviewerId: string) => {
    await assignReviewer(taskId, reviewerId);
    await refreshAll();
  }, [assignReviewer, refreshAll]);

  const submitReviewWithRefresh = useCallback(async (taskId: string, pass: boolean, remark?: string) => {
    await submitReview(taskId, pass, remark);
    await refreshAll();
  }, [submitReview, refreshAll]);

  const submitReworkWithRefresh = useCallback(async (taskId: string, remark?: string) => {
    await submitRework(taskId, remark);
    await refreshAll();
  }, [submitRework, refreshAll]);

  const archiveTaskWithRefresh = useCallback(async (taskId: string) => {
    await archiveTask(taskId);
    await refreshAll();
  }, [archiveTask, refreshAll]);

  return {
    createIssue: createIssueWithRefresh,
    updateIssue: updateIssueWithRefresh,
    deleteIssue: deleteIssueWithRefresh,
    assignEditor: assignEditorWithRefresh,
    assignReviewer: assignReviewerWithRefresh,
    submitReview: submitReviewWithRefresh,
    submitRework: submitReworkWithRefresh,
    archiveTask: archiveTaskWithRefresh,
  };
}
