/* eslint-disable prettier/prettier */
import {Octokit} from '@octokit/action'

const octokit = new Octokit()

// TODO: Pull GH app name from secret
export const COMMENT_AUTHOR = 'SECRET GITHUB APP NAME'

export type PullRequestContext = {
  owner: string;
  repo: string;
  issue_number: number;
}

export function PullRequestApiFactory(pr_args: PullRequestContext) {
  async function getComments() {
    return await octokit.request(
      'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
      pr_args
    )
  }
  
  async function createComment(message: string) {
    return await octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        ...pr_args,
        body: message
      }
    )
  }
  
  async function updateComment(
    comment_id: number,
    message: string
  ) {
    await octokit.request(
      'POST /repos/{owner}/{repo}/issues/comments/{comment_id}',
      {
        ...pr_args,
        comment_id,
        body: message
      }
    )
  }
  
  async function deleteComment(comment_id: number) {
    return await octokit.request(
      'DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}',
      {
        ...pr_args,
        comment_id
      }
    )
  }

  async function upsertComment(message: string): Promise<void | ReturnType<typeof createComment>> {
    const pr = PullRequestApiFactory(pr_args)
    const pr_comments = await pr.getComments()
  
    const feedback_comment = pr_comments.data.find(comment => {
      return comment.user?.name === COMMENT_AUTHOR
    })
  
    let comment_result
    if (!feedback_comment) {
      comment_result = await pr.createComment(message)
    } else {
      comment_result = await pr.updateComment(feedback_comment.id, message)
    }
    return comment_result
  }

  return {createComment, updateComment, upsertComment, getComments, deleteComment}
}


