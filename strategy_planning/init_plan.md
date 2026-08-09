# Initial plan

We want to design this as a mock social media platform, something designed like Twitter, ideally, where people can post, people can open their feeds, and people can comment, like, follow, retweet, and so on and so forth. We want the first pass to just be functional for the single-user journey that we define. That journey is:

1. A user goes into the main page and they see a feed of posts.
2. They can click a post, and each post has their own unique URL or path.
3. They can see the thread within that post and also click within each comment.
4. They can like and retweet a post.  Make this as much of a similarity to the Twitter UI as possible.

For the UI, let's use Vercel. For the backend, let's use a FastAPI app deployed to Railway.

Let's have the UI call the backend to fetch the feeds, and the backend returns a list of hydrated posts (post ID, text, existing engagement metrics, timestamp). When a user clicks a post, it hydrates the comments that the post has (and for each, still add the post ID, text, existing engagement metrics, timestamp).

Define data models using Pydantic.

Right now let's have a dummy dataset, defined in a Python file.
