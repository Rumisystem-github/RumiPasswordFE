export type Site = {
	"ID": string,
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