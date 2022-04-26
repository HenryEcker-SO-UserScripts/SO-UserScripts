// ==UserScript==
// @name         User Profile Links
// @description  Expands user network links menu to add chat profile links modified from https://github.com/samliew/SO-mod-userscripts/blob/master/UserProfileLinks.user.js
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       @samliew
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.51
//
// @match       *://*.stackoverflow.com/users*
// @match       *://*.serverfault.com/users*
// @match       *://*.superuser.com/users*
// @match       *://*.askubuntu.com/users*
// @match       *://*.mathoverflow.net/users*
// @match       *://*.stackexchange.com/users*
//
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      *://*.stackoverflow.com/c/*
//
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ChatProfileLinks.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ChatProfileLinks.user.js
// @grant        none
// ==/UserScript==

'use strict';

(function () {
    // Check if profile menu exists
    const isUserPage = document.body.classList.contains('user-page');
    const profilesMenu = document.getElementById('profiles-menu');
    if (!isUserPage || !profilesMenu) {
        console.log('User network profile dropdown not found.');
        return;
    }

    // Find network profile link
    const list = profilesMenu.querySelector('ul');
    const links = list.querySelectorAll('a');
    const networkProfileLink = [...links].filter(e => e.innerText.trim() === 'Network profile');

    if (networkProfileLink.length !== 1) {
        console.log('Network profile ID not found.');
        return;
    }
    // Get Network ID from networkProfileLink
    const aid = Number(networkProfileLink[0].getAttribute('href').match(/\/users\/(\d+)\//)[1]); // user account id

    list.innerHTML += `
<li class="s-menu--divider"></li>
<li role="menuitem">
  <a href="https://chat.stackoverflow.com/accounts/${aid}" title="Stack Overflow chat profile" class="s-block-link d-flex ai-center ws-nowrap d-flex ai-center">
    <div class="favicon favicon-stackoverflow site-icon mr4"></div>
    Chat.SO
  </a>
</li>
<li role="menuitem">
  <a href="https://chat.stackexchange.com/accounts/${aid}" title="Stack Exchange chat profile" class="s-block-link d-flex ai-center ws-nowrap d-flex ai-center">
    <div class="favicon favicon-stackexchange site-icon mr4"></div>
    Chat.SE
  </a>
</li>
<li role="menuitem">
  <a href="https://chat.meta.stackexchange.com/accounts/${aid}" title="Meta Stack Exchange chat profile" class="s-block-link d-flex ai-center ws-nowrap d-flex ai-center">
    <div class="favicon favicon-stackexchangemeta site-icon mr4"></div>
    Chat.MSE
  </a>
</li>
`;
})();
