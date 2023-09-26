"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 * - showDeleteBtn: show or hide delete button
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  const hostName = story.getHostName();
  // if a user is logged in, show favorite/not-favorite star
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        <div>
        ${showDeleteBtn ? getDeleteBtnHTML() : ""}
        ${showStar ? getStar(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <div class="story-author">by ${story.author}</div>
        <div class="story-user">posted by ${story.username}</div>
        </div>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// Handle submitting new story form. 
async function submitNewStory(e) {
  e.preventDefault();

  // grab all data from form
  const title = $("#create-title").val();
  const url = $("#create-url").val();
  const author = $("#create-author").val();
  const username = currentUser.username
  const storyData = { title, url, author, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // hide the form and reset it
  $submitForm.hide();
  $submitForm.trigger("reset");
  $allStoriesList.show();
}

// Put favorites list on page.
function putFavoritesListOnPage() {
  $favoritedStories.empty();  //empty so no duplicates appear

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added!</h5>");
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

// Handle favorite/un-favorite a story 
async function toggleStoryFavorite(e) {
  const $target = $(e.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // see if the item is already favorited (checking by presence of star)
  if ($target.hasClass("fa")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $target.closest("i").toggleClass("fa far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $target.closest("i").toggleClass("fa far");
  }
}

// Add user's own stories on page
function putUserStoriesOnPage() {
  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No stories added by user yet!</h5>");
  } else {
    // loop through all of users stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

// Make favorite/not-favorite star for story 
function getStar(story, user) {
  const isFavorite = user.isFavorite(story);
  const starStatus = isFavorite ? "fa" : "far";
  return `
      <span class="star">
        <i class="${starStatus} fa-star"></i>
      </span>`;
}

// Make delete button for story 
function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fa fa-trash-alt"></i>
      </span>`;
}

// Handle deleting a story. 
async function deleteStory(e) {
  const $closestLi = $(e.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  await putUserStoriesOnPage();
}

// On Clicks
$submitForm.on("submit", submitNewStory);
$storiesLists.on("click", ".star", toggleStoryFavorite);
$ownStories.on("click", ".trash-can", deleteStory);