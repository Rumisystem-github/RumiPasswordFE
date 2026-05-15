type BackgroundID = string;
export type ContextMenuItem = {
	id: string,
	name: string,
	fn: null|(()=>void)
}

window.addEventListener("load", function(){
	console.info("DialogSystem v1.0\nse YagiRımiṠingo / https://rumi-room.net/");
});

function show_bg(bg: boolean, fn: ()=>void): BackgroundID {
	let id = crypto.randomUUID();
	let el = document.createElement("DIV") as HTMLDivElement;
	el.dataset.id = id;
	el.className = "DIALOG_SYSTEM_BG";
	el.style.position = "fixed";
	el.style.top = "0";
	el.style.left = "0";
	el.style.width = "100vw";
	el.style.height = "100vh";
	if (bg) el.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

	document.body.append(el);

	el.onclick = function() {
		fn();
		el.remove();
	}

	return id;
}

export async function show_dialog(text: string): Promise<void> {
	let dialog = document.createElement("DIV");
	dialog.className = "DIALOG_SYSTEM_DIALOG";

	let text_area = document.createElement("DIV");
	text_area.className = "TEXT";
	text_area.innerText = text;
	dialog.append(text_area);

	let button_area = document.createElement("DIV");
	button_area.className = "BUTTON";
	dialog.append(button_area);

	let ok_button = document.createElement("BUTTON");
	ok_button.innerText = "おけ";
	button_area.append(ok_button);

	document.body.append(dialog);

	return new Promise((resolve) => {
		let id = show_bg(true, function() {
			dialog.remove();
			resolve();
		});

		ok_button.onclick = function() {
			document.querySelector(`[data-id="${id}"]`)?.remove();
			dialog.remove();
			resolve();
		}
	});
}

export async function show_yes_no(text: string, yes: boolean, no: boolean, cancel: boolean): Promise<boolean|null> {
	let dialog = document.createElement("DIV");
	dialog.className = "DIALOG_SYSTEM_DIALOG";

	let text_area = document.createElement("DIV");
	text_area.className = "TEXT";
	text_area.innerText = text;
	dialog.append(text_area);

	let button_area = document.createElement("DIV");
	button_area.className = "BUTTON";
	dialog.append(button_area);

	document.body.append(dialog);

	return new Promise((resolve) => {
		let id = show_bg(true, function() {
			dialog.remove();
			resolve(null);
		});

		function close() {
			document.querySelector(`[data-id="${id}"]`)?.remove();
			dialog.remove();
		}

		if (yes != null) {
			let button = document.createElement("BUTTON");
			button.innerText = "はい";
			button_area.append(button);
			button.onclick = function() {
				close();
				resolve(true);
			}
		}

		if (no != null) {
			let button = document.createElement("BUTTON");
			button.innerText = "いいえ";
			button_area.append(button);
			button.onclick = function() {
				close();
				resolve(false);
			}
		}

		if (cancel != null) {
			let button = document.createElement("BUTTON");
			button.innerText = "やめた";
			button_area.append(button);
			button.onclick = function() {
				close();
				resolve(null);
			}
		}
	});
}

export async function show_input(text: string): Promise<string|null> {
	let dialog = document.createElement("DIV");
	dialog.className = "DIALOG_SYSTEM_INPUTDIALOG";

	let text_area = document.createElement("DIV");
	text_area.className = "DIALOG_SYSTEM_CONTENTS";
	text_area.innerText = text;
	dialog.append(text_area);

	let input_area = document.createElement("DIV");
	let input = document.createElement("INPUT") as HTMLInputElement;
	input_area.append(input);
	dialog.append(input_area);

	let button_area = document.createElement("DIV");
	button_area.className = "BUTTON";
	dialog.append(button_area);

	let ok_button = document.createElement("BUTTON");
	ok_button.innerText = "おけ";
	button_area.append(ok_button);

	document.body.append(dialog);

	input.focus();

	return new Promise((resolve) => {
		let id = show_bg(true, function() {
			dialog.remove();
			resolve(null);
		});

		function close() {
			if (input.value.trim() === "") return;

			document.querySelector(`[data-id="${id}"]`)?.remove();
			dialog.remove();
			resolve(input.value);
		}

		ok_button.onclick = function() {
			close();
		}

		input.onkeydown = function(e) {
			if (e.key == "Enter") {
				close();
			}
		}
	});
}

export async function show_contextmenu(x: number, y: number, list: ContextMenuItem[]): Promise<string> {
	let contextmenu = document.createElement("DIV");
	contextmenu.className = "DIALOG_SYSTEM_CONTEXTMENU";
	contextmenu.style.top = `${x}px`;
	contextmenu.style.left = `${y}px`;

	document.body.append(contextmenu);

	return new Promise((resolve) => {
		let id = show_bg(false, function() {
			contextmenu.remove();
			resolve("");
		});

		for (const item of list) {
			let el = document.createElement("BUTTON");
			el.innerText = item.name;
			el.onclick = function() {
				if (item.fn != null) item.fn();
				resolve(item.id);

				contextmenu.remove();
				document.querySelector(`[data-id="${id}"]`)?.remove();
			}
			contextmenu.append(el);
		}
	});
}