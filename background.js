const TEXT_MENU_ID = 'search-text';
const IMAGE_MENU_ID = 'search-image';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: TEXT_MENU_ID,
      title: chrome.i18n.getMessage('searchText'),
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: IMAGE_MENU_ID,
      title: chrome.i18n.getMessage('searchImage'),
      contexts: ['image'],
      targetUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  });
});

async function openSearch(urls, tab) {
  const urlList = Array.isArray(urls) ? urls : [urls];

  if (tab && tab.incognito) {
    urlList.forEach((url, i) => {
      chrome.tabs.create({
        url,
        windowId: tab.windowId,
        index: tab.index + 1 + i,
        active: i === 0,
      });
    });
    return;
  }

  const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
  const incognitoWin = windows.find((w) => w.incognito);

  if (incognitoWin) {
    await chrome.windows.update(incognitoWin.id, { focused: true });

    urlList.forEach((url, i) => {
      chrome.tabs.create({
        url,
        windowId: incognitoWin.id,
        active: i === 0,
      });
    });
  } else {
    chrome.windows.create({
      url: urlList,
      incognito: true,
      type: 'normal',
      state: 'maximized',
    });
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === TEXT_MENU_ID && info.selectionText) {
    const query = info.selectionText.trim();

    if (!query) return;

    const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    openSearch(searchUrl, tab);
  }

  if (info.menuItemId === IMAGE_MENU_ID && info.srcUrl) {
    const encodedUrl = encodeURIComponent(info.srcUrl);

    const googleUrl = 'https://www.google.com/searchbyimage?image_url=' + encodedUrl;
    const yandexUrl = 'https://yandex.com/images/search?rpt=imageview&url=' + encodedUrl;

    openSearch([googleUrl, yandexUrl], tab);
  }
});
