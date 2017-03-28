"use strict";

export default class Permissions {
  constructor(){
    this.global = {};
    this.users = {};
  }

  checkPermission(user, permission) {
    try {
      let allowed = true;
      try {
        if (this.global.hasOwnProperty(permission)) {
          allowed = this.global[permission] === true;
        }
      } catch (e) {
      }
      try {
        if (this.users[user.id].hasOwnProperty(permission)) {
          allowed = this.users[user.id][permission] === true;
        }
      } catch (e) {
      }
      return allowed;
    } catch (e) {
    }
    return false;
  }

  importPermission(obj) {
    if (obj.hasOwnProperty('global')) {
      this.global = obj.global;
    }
    if (obj.hasOwnProperty('users')) {
      this.users = obj.users;
    }
  }
}