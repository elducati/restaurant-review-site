var App = window.App || {};
var addModalRating = 0;

App.$ = {};

App.ui = {
  cacheElements: function () {
    App.$ = {
      map: document.getElementById('map'),
      mapLoading: document.getElementById('map-loading'),
      list: document.getElementById('restaurant-list'),
      count: document.getElementById('restaurant-count'),
      filterContainer: document.getElementById('star-filter'),
      filterValue: document.getElementById('filter-value'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      sidebarBackdrop: document.getElementById('sidebar-backdrop'),
      reviewPanel: document.getElementById('review-panel'),
      panelBody: document.getElementById('panel-body'),
      panelContent: document.getElementById('panel-content'),
      panelClose: document.querySelector('.panel-close'),
      panelTitle: document.getElementById('panel-title'),
      addModal: document.getElementById('add-modal'),
      addForm: document.getElementById('add-form'),
      addName: document.getElementById('rest-name'),
      addAddress: document.getElementById('rest-address'),
      addRatingContainer: document.getElementById('rest-rating'),
      addCancelBtn: document.getElementById('add-cancel-btn'),
      addCloseBtn: document.querySelector('.modal-close'),
      addError: document.getElementById('add-error'),
      notification: document.getElementById('notification'),
      locateBtn: document.getElementById('locate-btn'),
    };
  },

  renderAll: function () {
    App.ui.renderSidebar();
    App.map.updateMarkers();
  },

  renderSidebar: function () {
    App.ui.renderRestaurantList();
    App.ui.renderCount();
  },

  renderRestaurantList: function () {
    var el = App.$.list;
    var filtered = App.data.getFilteredRestaurants();

    if (filtered.length === 0) {
      el.innerHTML = '<p class="hint" style="padding:1rem;text-align:center;">No restaurants match the filter. Try lowering the minimum rating.</p>';
      return;
    }

    el.innerHTML = '';
    filtered.forEach(function (restaurant) {
      el.appendChild(App.ui.createRestaurantCard(restaurant));
    });
  },

  createRestaurantCard: function (restaurant) {
    var card = document.createElement('div');
    card.className = 'restaurant-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', restaurant.name + ', rating ' + restaurant.avgRating.toFixed(1));

    if (App.state.selectedRestaurantId === restaurant.id) {
      card.classList.add('selected');
    }

    var stars = App.ui.createStarDisplay(restaurant.avgRating);

    card.innerHTML =
      '<div class="restaurant-card-header">' +
        '<span class="restaurant-card-name">' + App.utils.escapeHtml(restaurant.name) + '</span>' +
        '<span class="restaurant-card-rating">' +
          '<span>' + restaurant.avgRating.toFixed(1) + '</span>' +
          stars.outerHTML +
        '</span>' +
      '</div>' +
      '<div class="restaurant-card-meta">' +
        (restaurant.priceLevel ? '<span class="price-indicator">' + App.utils.priceSymbols(restaurant.priceLevel) + '</span>' : '') +
        '<span>' + (restaurant.source === 'local' ? 'Local' : 'Nearby') + '</span>' +
      '</div>' +
      '<div class="restaurant-card-address">' + App.utils.escapeHtml(restaurant.address || restaurant.vicinity || '') + '</div>' +
      '<div class="restaurant-card-reviews">' + App.utils.reviewCountText(restaurant) + '</div>';

    card.addEventListener('click', function () {
      App.ui.openReviewPanel(restaurant);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    return card;
  },

  renderCount: function () {
    var total = App.state.restaurants.length;
    var showing = App.data.getFilteredRestaurants().length;
    App.$.count.textContent = 'Showing ' + showing + ' of ' + total + ' restaurant' + (total !== 1 ? 's' : '');
  },

  renderFilterBar: function () {
    var container = App.$.filterContainer;
    container.innerHTML = '';

    for (var i = 1; i <= App.CONFIG.maxStars; i++) {
      (function (starValue) {
        var btn = document.createElement('button');
        btn.className = 'star-filter-btn' + (starValue <= App.state.filterMinRating ? ' active' : '');
        btn.textContent = '\u2605';
        btn.setAttribute('aria-label', starValue + ' star' + (starValue !== 1 ? 's' : '') + ' minimum');
        btn.setAttribute('aria-pressed', starValue <= App.state.filterMinRating ? 'true' : 'false');
        btn.addEventListener('click', function () {
          App.state.filterMinRating = starValue;
          App.ui.renderFilterBar();
          App.ui.renderAll();
          App.$.filterValue.textContent = starValue;
        });
        container.appendChild(btn);
      })(i);
    }

    App.$.filterValue.textContent = App.state.filterMinRating;
  },

  createStarDisplay: function (rating) {
    var maxStars = App.CONFIG.maxStars;
    var container = document.createElement('span');
    container.className = 'star-display';
    container.setAttribute('aria-label', rating.toFixed(1) + ' out of ' + maxStars + ' stars');
    var rounded = Math.round(rating);
    for (var i = 1; i <= maxStars; i++) {
      var star = document.createElement('span');
      star.textContent = '\u2605';
      star.className = i <= rounded ? 'star-filled' : 'star-empty';
      container.appendChild(star);
    }
    return container;
  },

  createInteractiveStars: function (value, maxStars, onChange) {
    maxStars = maxStars || App.CONFIG.maxStars;
    var container = document.createElement('div');
    container.className = 'interactive-stars';
    container.setAttribute('role', 'radiogroup');

    for (var i = 1; i <= maxStars; i++) {
      (function (starIdx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'star-btn' + (starIdx <= value ? ' active' : '');
        btn.textContent = '\u2605';
        btn.setAttribute('aria-label', starIdx + ' star' + (starIdx !== 1 ? 's' : ''));
        btn.setAttribute('aria-checked', starIdx <= value ? 'true' : 'false');
        btn.setAttribute('role', 'radio');
        btn.addEventListener('click', function () {
          onChange(starIdx);
          var allBtns = container.querySelectorAll('.star-btn');
          for (var j = 0; j < allBtns.length; j++) {
            allBtns[j].classList.toggle('active', j < starIdx);
            allBtns[j].setAttribute('aria-checked', j < starIdx ? 'true' : 'false');
          }
        });
        container.appendChild(btn);
      })(i);
    }
    return container;
  },

  openReviewPanel: function (restaurant) {
    App.state.selectedRestaurantId = restaurant.id;
    App.$.panelTitle.textContent = restaurant.name;
    App.ui.renderPanelContent(restaurant);
    App.$.reviewPanel.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    App.$.panelClose.focus();
    App.ui.closeSidebar();
    App.ui.renderSidebar();
  },

  closeReviewPanel: function () {
    App.$.reviewPanel.classList.add('hidden');
    document.body.style.overflow = '';
    App.state.selectedRestaurantId = null;
    App.ui.renderSidebar();
  },

  renderPanelContent: function (restaurant) {
    var el = App.$.panelContent;
    var stars = App.ui.createStarDisplay(restaurant.avgRating);

    var html =
      '<div class="panel-restaurant-name">' + App.utils.escapeHtml(restaurant.name) + '</div>' +
      '<div class="panel-restaurant-meta">' +
        '<span>' + stars.outerHTML + ' <strong>' + restaurant.avgRating.toFixed(1) + '</strong></span>' +
        (restaurant.priceLevel ? '<span>' + App.utils.priceSymbols(restaurant.priceLevel) + '</span>' : '') +
        (restaurant.totalRatings ? '<span>' + restaurant.totalRatings + ' ratings</span>' : '') +
      '</div>' +
      '<div class="panel-restaurant-meta">' +
        '<span>' + App.utils.escapeHtml(restaurant.address || restaurant.vicinity || '') + '</span>' +
      '</div>';

    el.innerHTML = html;

    var svContainer = document.createElement('div');
    svContainer.id = 'street-view';
    el.appendChild(svContainer);
    App.api.setupStreetView(restaurant.lat, restaurant.lng, svContainer);

    var reviewsTitle = document.createElement('div');
    reviewsTitle.className = 'panel-section-title';
    reviewsTitle.textContent = 'Reviews (' + restaurant.reviews.length + ')';
    el.appendChild(reviewsTitle);

    var reviewsContainer = document.createElement('div');
    reviewsContainer.id = 'reviews-container';

    if (restaurant.reviews.length === 0) {
      reviewsContainer.innerHTML = '<div class="review-no-reviews">No reviews yet. Be the first!</div>';
    } else {
      restaurant.reviews.forEach(function (review) {
        var reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        var reviewStars = App.ui.createStarDisplay(review.rating);
        reviewCard.innerHTML =
          '<div class="review-header">' +
            '<span class="review-author">' + App.utils.escapeHtml(review.author) + '</span>' +
            '<span class="review-date">' + App.utils.formatDate(review.date) + '</span>' +
          '</div>' +
          '<div>' + reviewStars.outerHTML + '</div>' +
          '<div class="review-text">' + App.utils.escapeHtml(review.text) + '</div>';
        reviewsContainer.appendChild(reviewCard);
      });
    }
    el.appendChild(reviewsContainer);

    var formArea = document.createElement('div');
    formArea.id = 'review-form-area';
    formArea.innerHTML =
      '<div class="panel-section-title">Add a Review</div>' +
      '<div class="form-group">' +
        '<label for="review-author">Your name</label>' +
        '<input type="text" id="review-author" placeholder="Your name" autocomplete="off">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="review-rating">Rating</label>' +
        '<div id="review-rating" class="interactive-stars" role="radiogroup" aria-label="Rating"></div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="review-text">Your review</label>' +
        '<textarea id="review-text" rows="3" placeholder="Share your experience..."></textarea>' +
      '</div>' +
      '<div class="form-actions">' +
        '<button type="button" class="btn btn-primary" id="submit-review-btn">Submit Review</button>' +
      '</div>' +
      '<p id="review-error" class="error-message hidden" role="alert"></p>';

    el.appendChild(formArea);

    var ratingContainer = document.getElementById('review-rating');
    var reviewRating = 0;
    var ratingStars = App.ui.createInteractiveStars(0, App.CONFIG.maxStars, function (v) { reviewRating = v; });
    ratingContainer.appendChild(ratingStars);

    document.getElementById('submit-review-btn').addEventListener('click', function () {
      var author = document.getElementById('review-author').value.trim();
      var text = document.getElementById('review-text').value.trim();
      var errorEl = document.getElementById('review-error');

      if (!author) { errorEl.textContent = 'Please enter your name'; errorEl.classList.remove('hidden'); return; }
      if (!reviewRating) { errorEl.textContent = 'Please select a rating'; errorEl.classList.remove('hidden'); return; }
      if (!text) { errorEl.textContent = 'Please write a review'; errorEl.classList.remove('hidden'); return; }

      errorEl.classList.add('hidden');
      App.data.addReview(restaurant.id, { author: author, rating: reviewRating, text: text });
    });
  },

  showAddModal: function (lat, lng) {
    addModalRating = 0;
    App.$.addName.value = '';
    App.$.addAddress.value = '';
    App.$.addError.classList.add('hidden');
    App.$.addModal.classList.remove('hidden');

    App.$.addRatingContainer.innerHTML = '';
    var stars = App.ui.createInteractiveStars(0, App.CONFIG.maxStars, function (v) { addModalRating = v; });
    App.$.addRatingContainer.appendChild(stars);

    App.$.addForm._lat = lat;
    App.$.addForm._lng = lng;

    App.$.addName.focus();
  },

  hideAddModal: function () {
    App.$.addModal.classList.add('hidden');
    App.$.addForm.reset();
    App.$.addError.classList.add('hidden');
  },

  handleAddSubmit: function (e) {
    e.preventDefault();
    var name = App.$.addName.value.trim();
    if (!name) {
      App.$.addError.textContent = 'Please enter a restaurant name';
      App.$.addError.classList.remove('hidden');
      return;
    }
    if (!addModalRating) {
      App.$.addError.textContent = 'Please select a rating';
      App.$.addError.classList.remove('hidden');
      return;
    }

    var restaurant = App.data.addRestaurant({
      name: name,
      lat: App.$.addForm._lat,
      lng: App.$.addForm._lng,
      address: App.$.addAddress.value.trim(),
      avgRating: addModalRating,
    });

    App.ui.hideAddModal();
    App.ui.showNotification('"' + restaurant.name + '" added!', 'success');
    App.ui.openReviewPanel(restaurant);
  },

  showNotification: function (message, type) {
    var el = App.$.notification;
    el.textContent = message;
    el.className = 'notification ' + (type || 'info');
    el.classList.remove('hidden');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.classList.add('hidden'); }, 3500);
  },

  initEventListeners: function () {
    App.$.panelClose.addEventListener('click', App.ui.closeReviewPanel);
    App.$.reviewPanel.querySelector('.panel-backdrop').addEventListener('click', App.ui.closeReviewPanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!App.$.reviewPanel.classList.contains('hidden')) App.ui.closeReviewPanel();
        if (!App.$.addModal.classList.contains('hidden')) App.ui.hideAddModal();
      }
    });

    App.$.addForm.addEventListener('submit', App.ui.handleAddSubmit);
    App.$.addCancelBtn.addEventListener('click', App.ui.hideAddModal);
    App.$.addCloseBtn.addEventListener('click', App.ui.hideAddModal);
    App.$.addModal.querySelector('.modal-backdrop').addEventListener('click', App.ui.hideAddModal);

    App.$.locateBtn.addEventListener('click', function () {
      if (App.state.userPosition) {
        App.map.panTo(App.state.userPosition.lat, App.state.userPosition.lng);
      } else {
        App.map.getUserLocation();
      }
    });

    App.$.sidebarToggle.addEventListener('click', App.ui.toggleSidebar);
    App.$.sidebarBackdrop.addEventListener('click', App.ui.closeSidebar);
  },

  toggleSidebar: function () {
    App.$.sidebar.classList.toggle('open');
    App.$.sidebarBackdrop.classList.toggle('hidden');
  },

  closeSidebar: function () {
    App.$.sidebar.classList.remove('open');
    App.$.sidebarBackdrop.classList.add('hidden');
  },
};
