/**
 * v1.0
 */
import { argon2id } from "hash-wasm";

const API_BASE_URL = "https://encrypt.rumiserver.com/api";
const KDF_CONFIG = {
	//256MB
	memory_size: 256*1024,
	//反復回数
	iteration: 4,
	//並列度
	parallelism: 4,
	//出力鍵長(AES-GCM)
	hash_length: 32,
	//お塩
	salt_length: 32
};

let self_key:Key;
let self_salt:Uint8Array;

type Key = {
	key: Uint8Array,
	salt: Uint8Array
};

type Encrypted = {
	data: Uint8Array,
	iv: Uint8Array,
	tag: Uint8Array
};

async function get_key(passcode: string, user_id: string, regist_date: Date, salt: Uint8Array): Promise<Key> {
	const passphrase = `${passcode}${user_id}${Math.floor(regist_date.getTime() / 1000)}`;

	const key = await argon2id({
		password: passphrase,
		salt: salt,
		parallelism: KDF_CONFIG.parallelism,
		iterations: KDF_CONFIG.iteration,
		memorySize: KDF_CONFIG.memory_size,
		hashLength: KDF_CONFIG.hash_length,
		outputType: "binary"
	});

	return {
		key: key,
		salt: salt
	};
}

function to_array_buffer(data: Uint8Array): ArrayBuffer {
	return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function import_key(key: Uint8Array): Promise<CryptoKey> {
	return await crypto.subtle.importKey(
		"raw",
		to_array_buffer(key),
		{ name: "AES-GCM" },
		false,
		[ "encrypt", "decrypt" ]
	);
}

async function encrypt(key: Uint8Array, plain: Uint8Array): Promise<Encrypted> {
	const iv = crypto.getRandomValues(new Uint8Array(12));

	const encrypted_and_tag = new Uint8Array(await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: iv
		},
		await import_key(key),
		to_array_buffer(plain)
	));

	const encrypted = encrypted_and_tag.slice(0, -16);
	const tag = encrypted_and_tag.slice(-16);

	return {
		data: encrypted,
		iv: iv,
		tag: tag
	};
}

async function decrypt(key: Uint8Array, encrypted: Encrypted): Promise<Uint8Array> {
	const encrypted_and_tag = new Uint8Array(encrypted.data.byteLength + encrypted.tag.byteLength);
	encrypted_and_tag.set(encrypted.data, 0);
	encrypted_and_tag.set(encrypted.tag, encrypted.data.byteLength);

	const decrypted = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: to_array_buffer(encrypted.iv)
		},
		await import_key(key),
		encrypted_and_tag
	);

	return new Uint8Array(decrypted);
}

function base64_encode(data: Uint8Array): string {
	let b64 = "";
	for (let i = 0; i < data.length; i++) {
		b64 += String.fromCharCode(data[i]);
	}
	return btoa(b64);
}

function base64_decode(base64: string): Uint8Array {
	const binary_string = atob(base64);
	const binary = new Uint8Array(binary_string.length);
	for (let i = 0; i < binary_string.length; i++) {
		binary[i] = binary_string.charCodeAt(i);
	}
	return binary;
}

export async function check_vault(token: string): Promise<boolean> {
	let ajax = await fetch("https://encrypt.rumiserver.com/api/Setting", {
		headers: {
			"Accept": "application/json",
			"TOKEN": token
		}
	});
	const result = await ajax.json();
	if (!result.STATUS) throw new Error("金庫システムへのアクセスに失敗しました");
	if (!result.ED) {
		return false;
	}

	self_salt = base64_decode(result.SALT);
	return true;
}

export async function passcode_login(token: string, passcode: string, user_id: string, regist_date: Date) {
	const key = await get_key(passcode, user_id, regist_date, self_salt);
	self_key = {
		key: key.key,
		salt: self_salt
	}

	try {
		const check_data = await get_private_key("PASSCODE_CHECK", token);
		if (new TextDecoder().decode(check_data) != user_id) {
			throw new Error("パスコードが違います(審査)");
		}
	} catch {
		throw new Error("パスコードが違います(復号)");
	}
}

export async function get_public_key(user_id: string, name: string): Promise<Uint8Array> {
	let ajax = await fetch(`${API_BASE_URL}/PublicKey?USER_ID=${user_id}&NAME=${name}`);
	const result = await ajax.bytes();
	return result;
}

export async function get_private_key(name: string, token: string): Promise<Uint8Array> {
	let ajax = await fetch(`${API_BASE_URL}/PrivateKey?NAME=${name}`, {
		headers: {
			"Accept": "application/json",
			"TOKEN": token
		}
	});
	const result = await ajax.json();
	if (!result.STATUS) throw new Error("鍵を取得できませんでした");

	const encrypted_key = base64_decode(result.KEY);
	const iv = base64_decode(result.IV);
	const tag = base64_decode(result.TAG);

	//復号化
	const decrypted = await decrypt(self_key.key, {data: encrypted_key, iv: iv, tag: tag});
	return decrypted;
}

export async function regist_private_key(name: string, token: string, key: Uint8Array) {
	const encrypted = await encrypt(self_key.key, key);

	let ajax = await fetch(`${API_BASE_URL}/PrivateKey`, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
			"TOKEN": token
		},
		body: JSON.stringify({
			"NAME": name,
			"TYPE": "AES-GCM",
			"KEY": base64_encode(encrypted.data),
			"IV": base64_encode(encrypted.iv),
			"TAG": base64_encode(encrypted.tag)
		})
	});
	const result = await ajax.json();
	if (!result.STATUS) throw new Error("登録失敗");
}