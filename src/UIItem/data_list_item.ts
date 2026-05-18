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
			} else if (data.NAME === "__TOTP") {
				async function gen(json: any): Promise<string> {
					const key = new Uint8Array(base64_decode(json["KEY"]));
					const period = Number.parseInt(json["PERIOD"]);
					const digits = Number.parseInt(json["DIGITS"]);
					const epoch = Math.floor(Date.now() / 1000);
					const counter = Math.floor(epoch / period);

					const buffer = new ArrayBuffer(8);
					const view = new DataView(buffer);
					view.setUint32(0, Math.floor(counter / 0x100000000), false);
					view.setUint32(4, counter >>> 0, false);

					//HMAC-SHA1
					const crypt_key = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash:"SHA-1" }, false, ["sign"]);
					const signature = await crypto.subtle.sign("HMAC", crypt_key, buffer);
					const digest = new Uint8Array(signature);

					const offset = digest[digest.length - 1] & 0x0F;
					const binary = ((digest[offset] & 0x7F) << 24) | ((digest[offset + 1] & 0xFF) << 16) | ((digest[offset + 2] & 0xFF) << 8) | (digest[offset + 3] & 0xFF);
					const totp = binary % Math.pow(10, digits);
					const code = totp.toString().padStart(digits, "0");
					return code;
				}

				const json = JSON.parse(text);
				const period = Number.parseInt(json["PERIOD"]);
				let code_el = document.createElement("DIV") as HTMLDivElement;
				let limit_el = document.createElement("PROGRESS") as HTMLProgressElement;
				value_el.append(code_el);
				value_el.append(limit_el);

				gen(json).then((code) => {
					code_el.innerText = code;
				});

				limit_el.value = period - (Math.floor(Date.now() / 1000) % period);
				limit_el.max = period;

				const int = setInterval(async function() {
					if (value_el.isConnected == false) {
						clearInterval(int);
						return;
					}

					const epoch = Math.floor(Date.now() / 1000);
					const remaining_second = period - (epoch % period);
					limit_el.value = remaining_second;

					if (remaining_second === period) {
						const code = await gen(json);
						code_el.innerText = code;
					}
				}, 1000);
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

				case "__TOTP": {
					name_el.innerText = "二段階認証";
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