import { create_site } from "../api";
import { mel } from "../main";

export function site_create_dialog_init() {
	//初期化
	mel.site_create_dialog.parent.style.display = "none";
	mel.site_create_dialog.name_input.value = "";

	//URL追加ボタン
	mel.site_create_dialog.url_add.onclick = function() {
		const input = prompt("ホスト名かURLをどうぞ");
		if (input == null) return;

		let item = document.createElement("DIV");
		let host_name = document.createElement("SPAN");
		let delete_button = document.createElement("BUTTON");

		if (input.startsWith("http://") || input.startsWith("https://")) {
			host_name.innerHTML = new URL(input).host;
		} else {
			host_name.innerHTML = input;
		}

		//削除ボタン
		delete_button.innerText = "X";
		delete_button.onclick = function() {
			item.remove();
		}

		item.append(host_name);
		item.append(delete_button);
		mel.site_create_dialog.url_list.append(item);
	}

	//作成ボタン
	mel.site_create_dialog.ok.onclick = async function() {
		if (mel.site_create_dialog.name_input.value == "") return;
		if (mel.site_create_dialog.url_list.children.length == 0) return;

		let host_list: string[] = [];
		for (const item of mel.site_create_dialog.url_list.children) {
			const host_name = item.querySelector("SPAN") as HTMLSpanElement;
			if (host_name == null) continue;

			host_list.push(host_name.innerText);
		}

		await create_site(mel.site_create_dialog.name_input.value, host_list);

		mel.site_create_dialog.name_input.value = "";
		mel.site_create_dialog.url_list.replaceChildren();
	}
}