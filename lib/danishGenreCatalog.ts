import {danishGenres as baseGenres,danishGenreCategories,type DanishGenre,type DanishGenreCategory} from "./danishGenres";
import {danishGenreExtras} from "./danishGenreExtras";
import {danishGenreMore} from "./danishGenreMore";

export type {DanishGenre,DanishGenreCategory};
export {danishGenreCategories};

export const danishGenres:DanishGenre[]=[...baseGenres,...danishGenreExtras,...danishGenreMore];
export const danishGenreByName=(name:string)=>danishGenres.find(g=>g.name===name)||danishGenres.find(g=>g.id===name);
