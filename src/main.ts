/* eslint-disable prettier/prettier */
import * as core from '@actions/core'
import { COMMENT_AUTHOR, PullRequestApiFactory, PullRequestContext } from './github'

export const CLEAN_NOISE=false

async function run(): Promise<void> {
  try {
    // Prepare inputs
    const pr_url: string = core.getInput('pull_request_id')
    const message: string = core.getInput('message')

    // Set up PR context & GH API
    const pr_context: PullRequestContext = {
      owner: '',
      repo: '', // TODO: Pull repo name from the GH environment
      issue_number: parseInt(pr_url)
    }
    const pr_api = PullRequestApiFactory(pr_context);

    // Upsert comment
    const comment_result = await pr_api.upsertComment(message);
    if (!comment_result) throw new Error('No result from upsert');
    console.log(`Upserted comment-${comment_result.data.id}`)
    
    // Clean any remaining noise
    const pr_comments = await pr_api.getComments();
    const all_our_comments = pr_comments.data.filter(comment => {
      return comment.user?.name === COMMENT_AUTHOR
    })
    if (all_our_comments.length > 1) {
      const noisy_comments = all_our_comments.slice(1)
      console.log(`Detected ${noisy_comments.length} noisy comments on ${pr_context.repo}#${pr_context.issue_number}, CLEAN_NOISE=${CLEAN_NOISE}`);
      for (const comment of noisy_comments) {
        if (CLEAN_NOISE) {
          await pr_api.deleteComment(comment.id);
          console.log(`Deleted comment-${comment.id}`);
        } else {
          console.log(`Left comment-${comment.id} alone`)
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

