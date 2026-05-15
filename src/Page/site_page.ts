import { create_data, get_data_list } from "../api";
import { show_contextmenu, show_input, type ContextMenuItem } from "../Lib/dialog";
import { encrypt, mel, site_list } from "../main";
import { data_list_item } from "../UIItem/data_list_item";

let site_id:string = "";

export async function open_site_page() {
	const id = window.location.pathname.replace("/site/", "").replaceAll("/", "");
	const site = site_list.find((s)=>s.ID == id);
	if (site == null) return;

	site_id = id;

	mel.contents.site.name.innerText = site.NAME;
	mel.contents.site.host.innerText = site.HOST[0];

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