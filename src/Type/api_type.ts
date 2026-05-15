import type { Data, Site } from "./item";

export type StandardAPIResult = {
	"STATUS": boolean
};

export type SiteGetAPIResult = {
	"STATUS": boolean,
	"LIST": Site[]
};

export type SiteCreateAPIResult = {
	"STATUS": boolean,
	"ID": string
};

export type DataGetAPIResult = {
	"STATUS": boolean,
	"LIST": Data[]
};

export type DataCreateAPIResult = {
	"STATUS": boolean,
	"ID": string
};