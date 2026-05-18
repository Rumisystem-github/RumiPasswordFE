import { create_data, create_dir, edit_site, get_data_list } from "../api";
import { show_contextmenu, show_custom_dialog, show_input, type ContextMenuItem } from "../Lib/dialog";
import { base64_encode, dir_list, encrypt, mel, refresh_dir_list, site_list } from "../main";
import { ui_refresh_site_list } from "../ui";
import { data_list_item } from "../UIItem/data_list_item";

let site_id:string = "";

export async function open_site_page() {
	const id = window.location.pathname.replace("/site/", "").replaceAll("/", "");
	const site = site_list.find((s)=>s.ID == id);
	if (site == null) return;

	site_id = id;

	mel.contents.site.name.innerText = site.NAME;
	mel.contents.site.host.innerText = site.HOST[0];
	mel.contents.site.host.href = `http://${site.HOST[0]}/`;

	mel.contents.site.edit.onclick = show_edit_dialog;

	await refresh();

	//表示
	mel.contents.site.parent.style.display = "block";
}

async function refresh() {
	//データ
	const data_list = await get_data_list(site_id);
	mel.contents.site.data_list.replaceChildren();
	for (const data of data_list) {
		mel.contents.site.data_list.append(await data_list_item(data));
	}

	//追加メニューアイテム
	let add_item:ContextMenuItem[] = [];
	if (!data_list.some((item)=>item.NAME === "__USER_ID")) add_item.push({ id: "USER_ID", name: "ユーザーID", fn: set_user_id });
	if (!data_list.some((item)=>item.NAME === "__MAIL_ADDRESS")) add_item.push({ id: "MAIL_ADDRESS", name: "メールアドレス", fn: set_mailaddess });
	if (!data_list.some((item)=>item.NAME === "__FEDIVERSE_ADDRESS")) add_item.push({ id: "FEDI_ADDRESS", name: "Fediverseアドレス", fn: set_fediverse_address });
	if (!data_list.some((item)=>item.NAME === "__PASSWORD")) add_item.push({ id: "PASSWORD", name: "パスワード", fn: set_password });
	if (!data_list.some((item)=>item.NAME === "__TOTP")) add_item.push({ id: "TOTP", name: "二段階革命論", fn: set_totp });
	add_item.push({ id: "ETC", name: "その他", fn: set_etc });

	mel.contents.site.add.onclick = async function() {
		const rect = mel.contents.site.add.getBoundingClientRect();
		await show_contextmenu(rect.top + rect.height, rect.left, add_item);
	}
}

async function set_user_id() {
	const input = await show_input("ユーザーID");
	if (input == null) return;

	await data_add("__USER_ID", input);
}

async function set_mailaddess() {
	const input = await show_input("メールアドレス");
	if (input == null) return;

	await data_add("__MAIL_ADDRESS", input);
}

async function set_fediverse_address() {
	const input = await show_input("Fediverseアドレス");
	if (input == null) return;

	await data_add("__FEDIVERSE_ADDRESS", input);
}

async function set_password() {
	const input = await show_input("パスワード");
	if (input == null) return;

	await data_add("__PASSWORD", input);
}

async function set_totp() {
	const input = await show_input("二段階認証のURLか、鍵を入力して");
	if (input == null) return;

	let key;
	let algorithm;
	let digits;
	let period;

	if (input.startsWith("otpauth://totp/")) {
		const url = new URL(input);
		if (url.searchParams.get("secret") == null || url.searchParams.get("algorithm") == null || url.searchParams.get("digits") == null || url.searchParams.get("period") == null) return;
		key = url.searchParams.get("secret");
		algorithm = url.searchParams.get("algorithm");
		digits = Number.parseInt(url.searchParams.get("digits")!);
		period = Number.parseInt(url.searchParams.get("period")!);
	} else {
		key = input;
		algorithm = "SHA1";
		digits = 6;
		period = 30;
	}

	const json = JSON.stringify(
		{
			"KEY": base64_encode(base32_decode(key!)),
			"ALGORITHM": algorithm,
			"DIGITS": digits,
			"PERIOD": period
		}
	);
	await data_add("__TOTP", json);
}

async function set_etc() {
	const name = await show_input("名前");
	if (name == null) return;
	const value = await show_input("値");
	if (value == null) return;

	await data_add(name, value);
}


async function data_add(name:string, data: string) {
	const encrypted = await encrypt(new TextEncoder().encode(data));
	await create_data(site_id, name, encrypted.key_id, encrypted.cipher, encrypted.iv, encrypted.tag);

	await refresh();
}

function show_edit_dialog() {
	const site = site_list.find((s)=>s.ID == site_id);
	if (site == null) return;

	let contents = document.createElement("DIV") as HTMLDivElement;

	//サイト名
	let name_input = document.createElement("INPUT") as HTMLInputElement;
	name_input.placeholder = "サイト名";
	name_input.value = site.NAME;
	contents.append(name_input);

	//ディレクトリ
	let dir_select = document.createElement("SELECT") as HTMLSelectElement;
	contents.append(dir_select);

	//ディレクトリ一覧
	let no_select_dir_item = document.createElement("OPTION") as HTMLOptionElement;
	no_select_dir_item.value = "null";
	no_select_dir_item.innerText = "ディレクトリ無し";
	dir_select.append(no_select_dir_item);
	for (const dir of dir_list) {
		let item = document.createElement("OPTION") as HTMLOptionElement;
		item.value = dir.ID;
		item.innerText = dir.NAME;
		if (site.DIR === dir.ID) item.setAttribute("selected", "");

		dir_select.append(item);
	}

	//ディレクトリ編集
	let dir_edit = document.createElement("BUTTON") as HTMLButtonElement;
	dir_edit.innerText = "編";
	contents.append(dir_edit);

	//ホスト一覧
	let host_list_el = document.createElement("DIV") as HTMLDivElement;
	for (const host of site.HOST) {
		let host_item = document.createElement("DIV") as HTMLDivElement;
		host_item.dataset.host = host;
		host_item.innerText = host;
		host_list_el.append(host_item);
	}
	contents.append(host_list_el);

	//ホスト追加
	let host_add = document.createElement("BUTTON") as HTMLButtonElement;
	host_add.innerText = "+";
	contents.append(host_add);

	//キャンセル
	let cancel_button = document.createElement("BUTTON") as HTMLButtonElement;
	cancel_button.innerText = "やめた";
	contents.append(cancel_button);

	//OK
	let ok_button = document.createElement("BUTTON") as HTMLButtonElement;
	ok_button.innerText = "OK";
	contents.append(ok_button);

	const dialog = show_custom_dialog(contents);

	//ディレクトリ編集ボタン
	dir_edit.onclick = async function() {
		const input = await show_input("ディレクトリ名");
		if (input == null) return;
		await create_dir(input);
		await refresh_dir_list();

		dir_select.replaceChildren();
		let no_select_dir_item = document.createElement("OPTION") as HTMLOptionElement;
		no_select_dir_item.value = "null";
		no_select_dir_item.innerText = "ディレクトリ無し";
		dir_select.append(no_select_dir_item);
		for (const dir of dir_list) {
			let item = document.createElement("OPTION") as HTMLOptionElement;
			item.value = dir.ID;
			item.innerText = dir.NAME;
			dir_select.append(item);
		}
	}

	//ホスト追加ボタン
	host_add.onclick = async function() {
		const input = await show_input("URLかホスト名");
		if (input == null) return;

		let host:string = "";
		if (input.startsWith("http://") || input.startsWith("https://")) {
			host = new URL(input).host;
		} else {
			host = input;
		}

		let host_item = document.createElement("DIV") as HTMLDivElement;
		host_item.dataset.host = host;
		host_item.innerText = host;
		host_list_el.append(host_item);
	}

	//キャンセルボタン
	cancel_button.onclick = function() {
		dialog.close();
	}

	//OKボタン
	ok_button.onclick = async function() {
		const name = name_input.value;
		let host_list = [];
		let dir_id = null;

		if (dir_select.value != "null") {
			dir_id = dir_select.value;
		}

		for (const el of host_list_el.children) {
			const item = el as HTMLElement;
			host_list.push(item.dataset.host!);
		}

		if (name === "") return;
		if (host_list.length === 0) return;

		await edit_site(site_id, name, dir_id, host_list);
		await refresh_dir_list();
		await ui_refresh_site_list();
		await open_site_page();

		dialog.close();
	}
}

function base32_decode(base32:string): Uint8Array {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	const str = base32.toUpperCase().replace(/=+$/, '');

	let bits = 0;
	let value = 0;
	let index = 0;
	const output = new Uint8Array(Math.floor(str.length * 5 / 8));

	for (const char of str) {
		const char_index = alphabet.indexOf(char);
		if (char_index === -1) throw new Error("変なBase32");

		value = (value << 5) | char_index;
		bits += 5;

		if (bits >= 8) {
			output[index++] = (value >>> (bits - 8)) & 0xFF;
			bits -= 8;
		}
	}

	return output;
}