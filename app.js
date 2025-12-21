const STORAGE_KEYS = {
  identity: "tonyn.identity",
  posts: "tonyn.posts",
  circles: "tonyn.circles",
  moments: "tonyn.moments",
};

const baseCircles = [
  { id: 1, title: "Quiet Creators", members: ["You", "Anon", "TempName"] },
  { id: 2, title: "Night Owls", members: ["You", "Beacon", "Anon"] },
  { id: 3, title: "Soft Launch", members: ["You", "Studio", "TempName"] },
];

const baseMoments = [
  {
    id: 1,
    title: "Morning Check-in",
    endsAt: Date.now() + 1000 * 60 * 42,
    memberCount: 8,
  },
  {
    id: 2,
    title: "Evening Reset",
    endsAt: Date.now() + 1000 * 60 * 85,
    memberCount: 5,
  },
];

const basePosts = [
  {
    id: 101,
    containerType: "home",
    authorDisplayName: "Anon",
    content: "Keeping today quiet. Taking small steps.",
    createdAt: Date.now() - 1000 * 60 * 12,
    expiresAt: Date.now() + 1000 * 60 * 48,
    comments: [
      { id: 1, author: "TempName", content: "Same here.", createdAt: Date.now() - 1000 * 60 * 8 },
    ],
    reactions: { "🙂": ["anon"] },
  },
  {
    id: 102,
    containerType: "circle",
    circleId: 1,
    authorDisplayName: "Studio",
    content: "New idea drop: short audio-only updates.",
    createdAt: Date.now() - 1000 * 60 * 30,
    expiresAt: Date.now() + 1000 * 60 * 120,
    comments: [],
    reactions: { "🔥": ["anon"] },
  },
  {
    id: 103,
    containerType: "moment",
    momentId: 1,
    authorDisplayName: "Beacon",
    content: "Moment goal: one honest sentence.",
    createdAt: Date.now() - 1000 * 60 * 10,
    expiresAt: Date.now() + 1000 * 60 * 25,
    comments: [
      { id: 2, author: "Anon", content: "Here for it.", createdAt: Date.now() - 1000 * 60 * 6 },
    ],
    reactions: { "🫶": ["anon"] },
  },
  {
    id: 104,
    containerType: "home",
    authorDisplayName: "TempName",
    content: "No notifications. Just presence.",
    createdAt: Date.now() - 1000 * 60 * 5,
    expiresAt: Date.now() + 1000 * 60 * 18,
    comments: [],
    reactions: {},
  },
  {
    id: 105,
    containerType: "circle",
    circleId: 2,
    authorDisplayName: "Anon",
    content: "Night Owls: write your one line for today.",
    createdAt: Date.now() - 1000 * 60 * 40,
    expiresAt: Date.now() + 1000 * 60 * 200,
    comments: [
      { id: 3, author: "You", content: "Done.", createdAt: Date.now() - 1000 * 60 * 4 },
    ],
    reactions: { "🙂": ["anon", "temp"] },
  },
  {
    id: 106,
    containerType: "moment",
    momentId: 2,
    authorDisplayName: "TempName",
    content: "Reset: breathe in, breathe out.",
    createdAt: Date.now() - 1000 * 60 * 22,
    expiresAt: Date.now() + 1000 * 60 * 35,
    comments: [],
    reactions: { "🫶": ["anon"] },
  },
  {
    id: 107,
    containerType: "home",
    authorDisplayName: "Studio",
    content: "Remember: moments end, meaning stays.",
    createdAt: Date.now() - 1000 * 60 * 2,
    expiresAt: Date.now() + 1000 * 60 * 78,
    comments: [],
    reactions: {},
  },
];

const identityDefaults = {
  mode: "anonymous",
  tempName: "TempName",
  realName: "Real Name",
};

const reactionOptions = ["🙂", "🔥", "🫶"];

const state = {
  identity: loadStored(STORAGE_KEYS.identity, identityDefaults),
  circles: mergeById(baseCircles, loadStored(STORAGE_KEYS.circles, [])),
  moments: mergeById(baseMoments, loadStored(STORAGE_KEYS.moments, [])),
  posts: mergeById(basePosts, loadStored(STORAGE_KEYS.posts, [])),
};

state.posts = state.posts.filter((post) => post.expiresAt > Date.now());
state.moments = state.moments.filter((moment) => moment.endsAt > Date.now());

persistState();

function loadStored(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.identity, JSON.stringify(state.identity));
  localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(state.posts));
  localStorage.setItem(STORAGE_KEYS.circles, JSON.stringify(state.circles));
  localStorage.setItem(STORAGE_KEYS.moments, JSON.stringify(state.moments));
}

function mergeById(base, extra) {
  const map = new Map(base.map((item) => [item.id, item]));
  extra.forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
}

function getDisplayName(containerType) {
  const { mode, tempName, realName } = state.identity;
  if (mode === "anonymous") {
    return "Anonymous";
  }
  if (mode === "temporary") {
    return tempName || "TempName";
  }
  if (mode === "real" && containerType === "circle") {
    return realName || "Real Name";
  }
  return "Anonymous";
}

function setIdentitySummary() {
  const summary = document.querySelector("[data-identity-summary]");
  if (!summary) return;
  if (state.identity.mode === "temporary") {
    summary.textContent = `Mode: ${state.identity.tempName || "TempName"}`;
    return;
  }
  if (state.identity.mode === "real") {
    summary.textContent = "Mode: Real name (circles)";
    return;
  }
  summary.textContent = "Mode: Anonymous";
}

function formatCountdown(expiresAt) {
  const remaining = Math.max(0, expiresAt - Date.now());
  const totalMinutes = Math.ceil(remaining / 60000);
  if (totalMinutes <= 0) return "Expired";
  if (totalMinutes < 60) return `${totalMinutes}m left`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h left`;
  return `${hours}h ${minutes}m left`;
}

function formatShortCountdown(expiresAt) {
  const remaining = Math.max(0, expiresAt - Date.now());
  const totalMinutes = Math.ceil(remaining / 60000);
  if (totalMinutes <= 0) return "Ended";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function updateCountdowns() {
  document.querySelectorAll("[data-countdown]").forEach((el) => {
    const expiresAt = Number(el.dataset.expiresAt);
    if (!expiresAt) return;
    el.textContent = formatCountdown(expiresAt);
  });

  const momentCountdown = document.querySelector("[data-moment-countdown]");
  const momentCountdownInline = document.querySelector("[data-moment-countdown-inline]");
  if (momentCountdown && momentCountdown.dataset.endsAt) {
    const endsAt = Number(momentCountdown.dataset.endsAt);
    const label = formatShortCountdown(endsAt);
    momentCountdown.textContent = `${label} left`;
    if (momentCountdownInline) {
      momentCountdownInline.textContent = label;
    }
    if (Date.now() >= endsAt) {
      handleMomentEnded();
    }
  }

  cleanupExpiredPosts();
}

function cleanupExpiredPosts() {
  const before = state.posts.length;
  state.posts = state.posts.filter((post) => post.expiresAt > Date.now());
  if (state.posts.length !== before) {
    persistState();
    renderFeed();
  }
}

function renderCircles() {
  const list = document.querySelector("[data-circles-list]");
  if (!list) return;
  list.innerHTML = "";
  state.circles.forEach((circle) => {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = `circle.html?id=${circle.id}`;
    link.innerHTML = `
      <strong>${circle.title}</strong>
      <span class="muted">${circle.members.length} members • Quiet by default</span>
    `;
    list.appendChild(link);
  });
}

function renderMoments() {
  const list = document.querySelector("[data-moments-list]");
  if (!list) return;
  list.innerHTML = "";
  const activeMoments = state.moments.filter((moment) => moment.endsAt > Date.now());
  activeMoments.forEach((moment) => {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = `moment.html?id=${moment.id}`;
    link.innerHTML = `
      <strong>${moment.title}</strong>
      <span class="muted">${formatShortCountdown(moment.endsAt)} left • ${moment.memberCount} inside</span>
    `;
    list.appendChild(link);
  });
  if (activeMoments.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <p>Nothing live right now.</p>
      <a class="primary" href="create.html">Start a Moment</a>
    `;
    list.appendChild(empty);
  }
}

function renderCircleDetails() {
  const titleEl = document.querySelector("[data-circle-title]");
  const membersEl = document.querySelector("[data-circle-members]");
  if (!titleEl || !membersEl) return;
  const circleId = Number(new URLSearchParams(window.location.search).get("id"));
  const circle = state.circles.find((item) => item.id === circleId) || state.circles[0];
  if (!circle) return;
  titleEl.textContent = circle.title;
  membersEl.innerHTML = "";
  circle.members.forEach((member) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = member;
    membersEl.appendChild(chip);
  });
}

function renderMomentDetails() {
  const titleEl = document.querySelector("[data-moment-title]");
  const membersEl = document.querySelector("[data-moment-members]");
  const countdownEl = document.querySelector("[data-moment-countdown]");
  const countdownInlineEl = document.querySelector("[data-moment-countdown-inline]");
  if (!titleEl || !membersEl || !countdownEl) return;
  const momentId = Number(new URLSearchParams(window.location.search).get("id"));
  const moment = state.moments.find((item) => item.id === momentId) || state.moments[0];
  if (!moment) return;
  titleEl.textContent = moment.title;
  membersEl.textContent = moment.memberCount;
  countdownEl.dataset.endsAt = moment.endsAt;
  if (countdownInlineEl) {
    countdownInlineEl.textContent = formatShortCountdown(moment.endsAt);
  }
  countdownEl.textContent = `${formatShortCountdown(moment.endsAt)} left`;
  if (Date.now() >= moment.endsAt) {
    handleMomentEnded();
  }
}

function handleMomentEnded() {
  const composer = document.querySelector("[data-composer]");
  if (composer) {
    composer.querySelectorAll("input, textarea, select, button").forEach((el) => {
      el.disabled = true;
    });
  }
  const endState = document.querySelector("[data-moment-ended]");
  if (endState) {
    endState.hidden = false;
  }
}

function renderFeed() {
  const feed = document.querySelector("[data-feed]");
  const empty = document.querySelector("[data-empty-feed]");
  if (!feed) return;
  const page = document.body.dataset.page || window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  let filtered = [];

  if (page.includes("circle.html")) {
    const circleId = Number(params.get("id"));
    filtered = state.posts.filter(
      (post) => post.containerType === "circle" && post.circleId === circleId
    );
  } else if (page.includes("moment.html")) {
    const momentId = Number(params.get("id"));
    filtered = state.posts.filter(
      (post) => post.containerType === "moment" && post.momentId === momentId
    );
  } else {
    filtered = state.posts.filter((post) => post.containerType === "home");
  }

  feed.innerHTML = "";
  filtered
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((post) => {
      const postEl = document.createElement("article");
      postEl.className = "post";
      postEl.dataset.postId = post.id;
      postEl.innerHTML = `
        <div class="post-header">
          <span class="post-author">${post.authorDisplayName}</span>
          <span class="countdown" data-countdown data-expires-at="${post.expiresAt}">${formatCountdown(
            post.expiresAt
          )}</span>
        </div>
        <p>${post.content}</p>
        <div class="reactions" data-reactions></div>
        <div class="comments" data-comments></div>
      `;

      const reactionsEl = postEl.querySelector("[data-reactions]");
      reactionOptions.forEach((reaction) => {
        const button = document.createElement("button");
        button.className = "reaction-btn";
        button.type = "button";
        button.textContent = reaction;
        const reacted = post.reactions?.[reaction]?.includes("you");
        if (reacted) button.classList.add("active");
        button.addEventListener("click", () => toggleReaction(post.id, reaction, button));
        reactionsEl.appendChild(button);
      });

      const commentsEl = postEl.querySelector("[data-comments]");
      if (post.comments?.length) {
        post.comments.forEach((comment) => {
          const commentEl = document.createElement("div");
          commentEl.className = "comment";
          commentEl.textContent = `${comment.author}: ${comment.content}`;
          commentsEl.appendChild(commentEl);
        });
      }

      const reacted = reactionOptions.some((reaction) => post.reactions?.[reaction]?.includes("you"));
      if (reacted) {
        const reactedNote = document.createElement("span");
        reactedNote.className = "muted tiny";
        reactedNote.textContent = "You reacted";
        reactionsEl.appendChild(reactedNote);
      }

      feed.appendChild(postEl);
    });

  if (empty) {
    empty.hidden = filtered.length !== 0;
  }
}

function toggleReaction(postId, reaction, button) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;
  post.reactions = post.reactions || {};
  post.reactions[reaction] = post.reactions[reaction] || [];
  const index = post.reactions[reaction].indexOf("you");
  if (index === -1) {
    post.reactions[reaction].push("you");
  } else {
    post.reactions[reaction].splice(index, 1);
  }
  persistState();
  renderFeed();
}

function setupComposer() {
  const composer = document.querySelector("[data-composer]");
  if (!composer) return;
  const input = composer.querySelector("[data-composer-input]");
  const button = composer.querySelector("[data-composer-submit]");
  const ttlSelect = composer.querySelector("[data-ttl-select]");
  const containerType = composer.dataset.containerType;
  const params = new URLSearchParams(window.location.search);

  button.addEventListener("click", () => {
    const content = input.value.trim();
    if (!content) return;
    const ttlSeconds = Number(ttlSelect.value);
    const newPost = {
      id: Date.now(),
      containerType,
      authorDisplayName: getDisplayName(containerType),
      content,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
      comments: [],
      reactions: {},
    };
    if (containerType === "circle") {
      newPost.circleId = Number(params.get("id"));
    }
    if (containerType === "moment") {
      newPost.momentId = Number(params.get("id"));
    }
    state.posts.push(newPost);
    persistState();
    input.value = "";
    renderFeed();
  });
}

function setupAuthForm() {
  const form = document.querySelector("[data-auth-form]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    state.identity.mode = formData.get("identityMode") || "anonymous";
    state.identity.tempName = formData.get("tempName") || "TempName";
    persistState();
    window.location.href = "home.html";
  });
}

function setupSettingsForm() {
  const form = document.querySelector("[data-identity-form]");
  if (!form) return;
  const modeInputs = form.querySelectorAll("input[name='identityMode']");
  modeInputs.forEach((input) => {
    if (input.value === state.identity.mode) {
      input.checked = true;
    }
  });
  form.querySelector("input[name='tempName']").value = state.identity.tempName || "";
  form.querySelector("input[name='realName']").value = state.identity.realName || "";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    state.identity.mode = formData.get("identityMode") || "anonymous";
    state.identity.tempName = formData.get("tempName") || "TempName";
    state.identity.realName = formData.get("realName") || "Real Name";
    persistState();
    setIdentitySummary();
  });
}

function setupCreateForms() {
  const circleForm = document.querySelector("[data-create-circle]");
  if (circleForm) {
    circleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(circleForm);
      const title = formData.get("title");
      const membersRaw = formData.get("members");
      const members = membersRaw
        .split(",")
        .map((member) => member.trim())
        .filter(Boolean);
      const newCircle = {
        id: Date.now(),
        title,
        members: members.length ? members : ["You"],
      };
      state.circles.push(newCircle);
      persistState();
      window.location.href = `circle.html?id=${newCircle.id}`;
    });
  }

  const momentForm = document.querySelector("[data-create-moment]");
  if (momentForm) {
    momentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(momentForm);
      const title = formData.get("title");
      const duration = Number(formData.get("duration"));
      const members = Number(formData.get("members"));
      const newMoment = {
        id: Date.now(),
        title,
        endsAt: Date.now() + duration * 1000,
        memberCount: members,
      };
      state.moments.push(newMoment);
      persistState();
      window.location.href = `moment.html?id=${newMoment.id}`;
    });
  }
}

function init() {
  setIdentitySummary();
  renderCircles();
  renderMoments();
  renderCircleDetails();
  renderMomentDetails();
  renderFeed();
  setupComposer();
  setupAuthForm();
  setupSettingsForm();
  setupCreateForms();
  updateCountdowns();
  setInterval(updateCountdowns, 1000);
}

document.addEventListener("DOMContentLoaded", init);
