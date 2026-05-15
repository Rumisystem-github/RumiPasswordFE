import { get_token } from "./login";
import { base64_encode } from "./main";
import type { DataGetAPIResult, SiteCreateAPIResult, SiteGetAPIResult } from "./Type/api_type";
import type { Data, Site } from "./Type/item";

async function get(path: string): Promise<object> {
	let ajax = await fetch(`/api${path}`, {
		method: "GET",
		headers: {
			"Accept": "application/json; charset=UTF-8",
			"Content-Type": "application/json; charset=UTF-8",
			"TOKEN": get_token()
		}
	});
	const result = await ajax.json();
	return result;
}

async function post(path: string, body: string): Promise<object> {
	let ajax = await fetch(`/api${path}`, {
		method: "POST",
		headers: {
			"Accept": "application/json; charset=UTF-8",
			"Content-Type": "application/json; charset=UTF-8",
			"TOKEN": get_token()
		},
		body: body
	});
	const result = await ajax.json();
	return result;
}

async function patch(path: string, body: string): Promise<object> {
	let ajax = await fetch(`/api${path}`, {
		method: "PATCH",
		headers: {
			"Accept": "application/json; charset=UTF-8",
			"Content-Type": "application/json; charset=UTF-8",
			"TOKEN": get_token()
		},
		body: body
	});
	const result = await ajax.json();
	return result;
}

//------------------------------------------------------------------------------------------------------------------------

export async function get_site_list(): Promise<Site[]> {
	const result = await get("/Site") as SiteGetAPIResult;
	if (!result.STATUS) throw new Error("取得失敗");

	return result.LIST;
}

export async function create_site(name: string, host_list: string[]): Promise<string> {
	const result = await post("/Site", JSON.stringify({ "NAME": name, "HOST": host_list })) as SiteCreateAPIResult;
	if (!result.STATUS) throw new Error("サイトを作れませんでした");

	return result.ID;
}

//------------------------------------------------------------------------------------------------------------------------
export async function get_data_list(site_id: string): Promise<Data[]> {
	const result = await get("/Data?SITE_ID=" + site_id) as DataGetAPIResult;
	if (!result.STATUS) throw new Error("取得失敗");

	return result.LIST;
}

export async function create_data(site_id: string, name: string, key_id: number, data: Uint8Array, iv: Uint8Array, tag: Uint8Array): Promise<string> {
	const result = await post("/Data", JSON.stringify({ "SITE_ID": site_id, "NAME": name, "KEY_ID": key_id, "DATA": base64_encode(data), "IV": base64_encode(iv), "TAG": base64_encode(tag) })) as DataCreateAPIResult;
	if (!result.STATUS) throw new Error("データを作れませんでした");

	return result.ID;
}