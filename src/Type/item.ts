export type Site = {
	"ID": string,
	"DIR": string | null,
	"NAME": string,
	"HOST": string[]
}

export type Data = {
	"ID": string,
	"NAME": string,
	"ENCRYPT_TYPE": string,
	"KEY_ID": number,
	"DATA": string,
	"IV": string,
	"TAG": string
}

export type Dir = {
	"ID": string,
	"NAME": string
}