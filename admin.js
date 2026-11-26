/* HYPRRIDE — staff sign-in page.
   The old booking board kept a copy of every booking (names, phones, addresses, emergency
   contacts) in each staff browser. Bookings live on Hyprverse now, so delete that copy the
   first time this page opens in a browser that has one. */
(function () {
  'use strict';
  try {
    ['hyprride_bookings', 'hyprride_fleet', 'hyprride_admin_email'].forEach(function (key) {
      localStorage.removeItem(key);
    });
    sessionStorage.removeItem('hyprride_admin');
  } catch (e) {
    /* storage is blocked in this browser, so the old board could not have kept anything here */
  }
})();
