import { delete_data, edit_data } from "../api";
import { show_custom_dialog, show_yes_no } from "../Lib/dialog";
import { base64_decode, decrypt, encrypt } from "../main";
import type { Data } from "../Type/item";

export async function data_list_item(data: Data): Promise<HTMLDivElement> {
	let item = document.createElement("DIV") as HTMLDivElement;
	item.className = "DATA_ITEM";

	let name_el = document.createElement("DIV") as HTMLDivElement;
	name_el.className = "NAME";
	name_el.innerText = "お待ち下さい";
	item.append(name_el);

	let value_el = document.createElement("DIV") as HTMLDivElement;
	value_el.className = "VALUE";
	item.append(value_el);

	let edit_button_el = document.createElement("BUTTON") as HTMLButtonElement;
	edit_button_el.className = "EDIT";
	edit_button_el.innerText = "編";
	item.append(edit_button_el);

	(async function() {
		const raw = await decrypt({ cipher: base64_decode(data.DATA), iv: base64_decode(data.IV), tag: base64_decode(data.TAG), key_id: data.KEY_ID });
		if (data.NAME.startsWith("__")) {

			//静的な特殊データ
			const text = new TextDecoder().decode(raw);
			if (data.NAME === "__PASSWORD") {
				value_el.append(hide_text(text));
			} else {
				value_el.append(data_text(text));
			}

			switch (data.NAME) {
				case "__USER_ID": {
					name_el.innerText = "ユーザーID";
					break;
				}

				case "__MAIL_ADDRESS": {
					name_el.innerText = "メールアドレス";
					break;
				}

				case "__FEDIVERSE_ADDRESS": {
					name_el.innerText = "Fediverseアドレス";
					break;
				}

				case "__PASSWORD": {
					name_el.innerText = "パスワード";
					break;
				}
			}

			edit_button_el.onclick = function() {
				const current_value = text;

				let contents = document.createElement("DIV") as HTMLDivElement;

				let value_input = document.createElement("INPUT") as HTMLInputElement;
				value_input.placeholder = name_el.innerText;
				value_input.value = current_value;
				contents.append(value_input);

				let ok_button = document.createElement("BUTTON") as HTMLButtonElement;
				ok_button.innerText = "OK";
				contents.append(ok_button);

				let delete_button = document.createElement("BUTTON") as HTMLButtonElement;
				delete_button.innerText = "削除";
				contents.append(delete_button);

				const dialog = show_custom_dialog(contents);

				//OKボタン
				ok_button.onclick = async function() {
					dialog.close();

					//変更がアレば変更
					if (current_value == value_input.value) return;
					const encrypted = await encrypt(new TextEncoder().encode(value_input.value));
					edit_data(data.ID, data.NAME, encrypted.key_id, encrypted.cipher, encrypted.iv, encrypted.tag);

					//UIを更新
					value_el.replaceChildren();
					value_el.append(data_text(value_input.value));
				}

				//削除ボタン
				delete_button.onclick = async function() {
					if (await show_yes_no(`「${name_el.innerText}」を削除しますか？`, true, true, false) != true) return;
					await delete_data(data.ID);
					item.remove();
					dialog.close();
				}
			}
		} else {
			const text = new TextDecoder().decode(raw);
			name_el.innerText = data.NAME;
			value_el.append(data_text(text));

			edit_button_el.onclick = function() {
				const current_name = data.NAME;
				const current_value = text;

				let contents = document.createElement("DIV") as HTMLDivElement;

				let name_input = document.createElement("INPUT") as HTMLInputElement;
				name_input.placeholder = "名前";
				name_input.value = current_name;
				contents.append(name_input);

				let value_input = document.createElement("INPUT") as HTMLInputElement;
				value_input.placeholder = "値";
				value_input.value = current_value;
				contents.append(value_input);

				let ok_button = document.createElement("BUTTON") as HTMLButtonElement;
				ok_button.innerText = "OK";
				contents.append(ok_button);

				let delete_button = document.createElement("BUTTON") as HTMLButtonElement;
				delete_button.innerText = "削除";
				contents.append(delete_button);

				const dialog = show_custom_dialog(contents);

				//OKボタン
				ok_button.onclick = async function() {
					dialog.close();

					//変更がアレば変更
					if (current_name == name_input.value && current_value == value_input.value) return;
					const encrypted = await encrypt(new TextEncoder().encode(value_input.value));
					edit_data(data.ID, name_input.value, encrypted.key_id, encrypted.cipher, encrypted.iv, encrypted.tag);

					//UIを更新
					value_el.replaceChildren();
					name_el.innerText = name_input.value;
					value_el.append(data_text(value_input.value));
				}

				//削除ボタン
				delete_button.onclick = async function() {
					if (await show_yes_no(`「${data.NAME}」を削除しますか？`, true, true, false) != true) return;
					await delete_data(data.ID);
					item.remove();
					dialog.close();
				}
			}
			return;
		}
	})();

	return item;
}

async function cpi(text: string) {
	await navigator.clipboard.writeText(text);
}

function data_text(text: string): HTMLDivElement {
	let el = document.createElement("DIV") as HTMLDivElement;

	el.innerText = text;

	el.onclick = async function() {
		await cpi(text);
	}

	return el;
}

function hide_text(text: string): HTMLDivElement {
	let el = document.createElement("DIV") as HTMLDivElement;

	el.innerText = "▓▓▓▓▓▓▓▓▓▓▓▓▓";
	el.style.filter = "blur(10px)";

	el.onmouseover = function() {
		el.style.filter = "";
		el.innerText = text;
	}

	el.onmouseleave = function() {
		el.style.filter = "blur(10px)";
		el.innerText = "▓▓▓▓▓▓▓▓▓▓▓▓▓";
	}

	el.onclick = async function() {
		await cpi(text);
	}

	return el;
}