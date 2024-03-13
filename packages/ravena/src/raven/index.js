import data from "ravena/src/raven/data";
import view from "ravena/src/raven/view";
import time from "ravena/src/raven/time";
import storage from "ravena/src/raven/storage";
import http from "ravena/src/raven/http";
import route from "ravena/src/raven/route";

const raven = {};

raven.data = data;
Object.defineProperty(raven, "view", view);
Object.defineProperty(raven, "time", time);
Object.defineProperty(raven, "storage", storage);
Object.defineProperty(raven, "http", http);
Object.defineProperty(raven, "route", route);

export default raven;
