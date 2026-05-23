App.init = async function () {
  App.ui.cacheElements();

  var apiKey = App.utils.getApiKey();
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    App.$.mapLoading.textContent = 'Please set your Google Maps API key. See README.md for instructions.';
    App.ui.showNotification('Google Maps API key not configured', 'error');
    return;
  }

  try {
    await App.api.loadGoogleMapsAPI(apiKey);
    await App.data.loadLocalRestaurants();
    App.map.init();
    App.ui.renderFilterBar();
    App.ui.initEventListeners();
  } catch (err) {
    console.error('Initialization error:', err);
    App.$.mapLoading.textContent = 'Failed to load. Check console for details.';
    App.ui.showNotification('Failed to initialize: ' + err.message, 'error');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
