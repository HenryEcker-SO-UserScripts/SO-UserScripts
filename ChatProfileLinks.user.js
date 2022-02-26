// ==UserScript==
// @name         User Profile Links
// @description  Expands user network links menu to add chat profile links modified from https://github.com/samliew/SO-mod-userscripts/blob/master/UserProfileLinks.user.js
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       @samliew
// @contributor  Henry Ecker (https://github.com/HenryEcker)
// @version      1.31
//
// @include      https://*stackoverflow.com/users*
// @include      https://*serverfault.com/users*
// @include      https://*superuser.com/users*
// @include      https://*askubuntu.com/users*
// @include      https://*mathoverflow.net/users*
// @include      https://*stackexchange.com/users*
//
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

'use strict';

(function() {

    // Check if profile menu exists
    const isUserPage = document.body.classList.contains('user-page');
    const profilesMenu = document.getElementById('profiles-menu');
    if(!isUserPage && !profilesMenu) {
        console.log('User network profile dropdown not found.');
        return;
    }

    // Add chat profile links to menu
    const list = profilesMenu.querySelector('ul');
    const links = list.querySelectorAll('a');
    const aid = Number(links[links.length - 1].getAttribute('href').match(/\/users\/(\d+)\//)[1]); // user account id

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
