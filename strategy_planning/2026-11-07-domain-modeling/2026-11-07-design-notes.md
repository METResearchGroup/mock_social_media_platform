# 2026-11-07 Design Notes

I need to get this to a state where we can start using it, ideally next week.

Some things that come up:

- Admin login.
- Storing data.
- Supporting different experimental conditions.

What we want is something like:

- For storing data, let's use S3. Let's discuss the data models that are needed for this.
- We need to store the experimental feeds. We need to store the posts and then link them to a user.

Key domain models:

- user (might need a better name): someone who's an admin and has an account (e.g.,. a researcher, but I don't want to hardcode a name like "researcher" as that's too domain-specific)
- participant: someone who participates in the experiment. They're shown a feed, they record activities, and then these activities are aggregated as engagements.
- post: a single post or record or thing shown to users. (unsure if we should call it posts? Maybe stimuli? But I want something that's closer to "posts" than stimuli since we're in a social media context).
- feed: a series of posts
- engagement: an aggregate measure of some activity type, across some dimension (e.g., total likes for a post, total posts liked by a user, etc.). May need a different or better name.

Format might be something like:

user_id={user_id}/
    ...
