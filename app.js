const STORAGE_KEYS = {
  session: "softexit.session",
  posts: "softexit.posts",
  viewedImages: "softexit.viewedImages",
};

const state = {
  posts: loadStored(STORAGE_KEYS.posts, seedPosts()),
  viewedImages: new Set(loadStored(STORAGE_KEYS.viewedImages, [])),
  viewedThisSession: new Set(),
};

state.posts = state.posts.filter((post) => post.expiresAt > Date.now());
persistPosts();

const modal = document.querySelector("[data-modal]");
const openComposerButton = document.querySelector("[data-open-composer]");
const closeModalButtons = document.querySelectorAll("[data-close-modal]");

function loadStored(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function persistPosts() {
  localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(state.posts));
  localStorage.setItem(
    STORAGE_KEYS.viewedImages,
    JSON.stringify(Array.from(state.viewedImages))
  );
}

function seedPosts() {
  const now = Date.now();
  return [
    {
      id: now - 1000 * 60 * 10,
      type: "text",
      content: "Taking today slow. Just breathing.",
      createdAt: now - 1000 * 60 * 10,
      expiresAt: now + 1000 * 60 * 50,
    },
    {
      id: now - 1000 * 60 * 35,
      type: "text",
      content: "Quiet wins only. No need to announce them.",
      createdAt: now - 1000 * 60 * 35,
      expiresAt: now + 1000 * 60 * 95,
    },
    {
      id: now - 1000 * 60 * 5,
      type: "image",
      content: "",
      imageData:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMyODJiMzMiLz48cGF0aCBkPSJNMTUwIDI2MGgxMDBsNzAtOTAgMTIwIDE0MCAxMTAtMTEwaDExMFYzMjBIMTUweiIgZmlsbD0iIzM4M2M0OCIvPjwvc3ZnPg==",
      viewOnce: true,
      createdAt: now - 1000 * 60 * 5,
      expiresAt: now + 1000 * 60 * 55,
    },
  ];
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

function renderFeed() {
  const feed = document.querySelector("[data-feed]");
  const empty = document.querySelector("[data-empty-feed]");
  if (!feed) return;

  feed.innerHTML = "";
  const activePosts = state.posts
    .filter((post) => post.expiresAt > Date.now())
    .sort((a, b) => b.createdAt - a.createdAt);

  activePosts.forEach((post) => {
    const postEl = document.createElement("article");
    postEl.className = "post";
    postEl.dataset.postId = post.id;

    postEl.innerHTML = `
      <div class="post-header">
        <span class="post-author">Anon</span>
        <span class="countdown" data-countdown data-expires-at="${post.expiresAt}">
          ${formatCountdown(post.expiresAt)}
        </span>
      </div>
      ${post.type === "text" ? `<p>${post.content}</p>` : renderImageBlock(post)}
    `;

    feed.appendChild(postEl);
  });

  if (empty) {
    empty.hidden = activePosts.length > 0;
  }

  handleViewOnceImages();
}

function renderImageBlock(post) {
  if (post.viewOnce && state.viewedImages.has(String(post.id))) {
    return `<div class="post-image viewed">Image viewed</div>`;
  }

  const overlayText = post.viewOnce ? "Tap to view · Once" : "";
  const blurClass = post.viewOnce ? "blur" : "";
  const overlay = post.viewOnce
    ? `<div class="overlay">${overlayText}</div>`
    : "";

  return `
    <div class="post-image ${blurClass}" data-view-once="${post.viewOnce}" data-image-id="${post.id}">
      <img src="${post.imageData}" alt="Shared image" />
      ${overlay}
    </div>
  `;
}

function createPost({ type, content, imageData, viewOnce, ttlSeconds }) {
  const newPost = {
    id: Date.now(),
    type,
    content: content || "",
    imageData: imageData || "",
    viewOnce: Boolean(viewOnce),
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  };

  state.posts.unshift(newPost);
  persistPosts();
  renderFeed();
}

function startCountdowns() {
  setInterval(() => {
    document.querySelectorAll("[data-countdown]").forEach((el) => {
      const expiresAt = Number(el.dataset.expiresAt);
      if (!expiresAt) return;
      const remaining = expiresAt - Date.now();
      el.textContent = formatCountdown(expiresAt);
      el.classList.toggle("urgent", remaining <= 60000);
      if (remaining <= 0) {
        const post = el.closest(".post");
        if (post) {
          // Fade out before removing the expired element for a softer transition.
          post.classList.add("fade-out");
          setTimeout(() => post.remove(), 400);
        }
      }
    });

    cleanupExpiredPosts();
  }, 1000);
}

function cleanupExpiredPosts() {
  const now = Date.now();
  const active = state.posts.filter((post) => post.expiresAt > now);
  if (active.length !== state.posts.length) {
    state.posts = active;
    persistPosts();
    renderFeed();
  }
}

function handleViewOnceImages() {
  // We attach click listeners after each render to control one-time reveals.
  document.querySelectorAll("[data-view-once='true']").forEach((container) => {
    const imageId = container.dataset.imageId;
    if (!imageId) return;
    if (state.viewedImages.has(String(imageId))) return;

    container.addEventListener("click", () => {
      container.classList.remove("blur");
      const overlay = container.querySelector(".overlay");
      if (overlay) overlay.remove();

      // Track view-once reveals for this session only. We persist on unload so the
      // image can be viewed once now but never again after leaving the page.
      state.viewedThisSession.add(String(imageId));
    }, { once: true });
  });
}

function setupComposer() {
  const form = document.querySelector("[data-composer]");
  if (!form) return;
  const postType = form.querySelector("[data-post-type]");
  const textField = form.querySelector("[data-text-field]");
  const imageField = form.querySelector("[data-image-field]");
  const imageInput = form.querySelector("[data-image-input]");
  const imagePreview = form.querySelector("[data-image-preview]");
  const previewImg = imagePreview?.querySelector("img");

  postType.addEventListener("change", () => {
    const isImage = postType.value === "image";
    textField.hidden = isImage;
    imageField.hidden = !isImage;
  });

  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (!previewImg) return;
      previewImg.src = reader.result;
      imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const ttlSeconds = Number(formData.get("ttl"));
    const type = formData.get("postType");
    const viewOnce = form.querySelector("[data-view-once]").checked;

    if (type === "image") {
      const file = imageInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        createPost({
          type: "image",
          imageData: reader.result,
          viewOnce,
          ttlSeconds,
        });
        closeModal();
        form.reset();
        imagePreview.hidden = true;
      };
      reader.readAsDataURL(file);
      return;
    }

    createPost({
      type: "text",
      content: formData.get("content"),
      ttlSeconds,
    });
    closeModal();
    form.reset();
  });
}

function openModal() {
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  const focusTarget = modal.querySelector("input, textarea, select, button");
  if (focusTarget) focusTarget.focus();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
}

function setupModalControls() {
  if (openComposerButton) {
    openComposerButton.addEventListener("click", openModal);
  }
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function setupGate() {
  const enterButton = document.querySelector("[data-enter]");
  if (!enterButton) return;
  enterButton.addEventListener("click", () => {
    // Presence gate: store a lightweight session marker only.
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ enteredAt: Date.now() }));
    window.location.href = "home.html";
  });
}

function init() {
  setupGate();
  renderFeed();
  setupComposer();
  setupModalControls();
  startCountdowns();
  window.addEventListener("beforeunload", () => {
    state.viewedThisSession.forEach((id) => state.viewedImages.add(id));
    persistPosts();
  });
}

document.addEventListener("DOMContentLoaded", init);
