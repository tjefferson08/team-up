import { randomUUID } from "~/uuid";

export type Team = {
  id: string;
  name: string;
};

export type Member = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const kvStorageFor = (env: Env) => (ns: string) => {
  return {
    async get(uuid: string) {
      const json = await env.DB.get(`${ns}::${uuid}`);
      if (!json) {
        throw new Error(`No item found for provided ID: ${uuid}`);
      }
      return JSON.parse(json);
    },

    async create(payload: any) {
      const uuid = randomUUID();
      await env.DB.put(
        `${ns}::${uuid}`,
        JSON.stringify({ id: uuid, ...payload })
      );

      return uuid;
    },

    // TODO: page
    // TODO: key metadata?
    async list() {
      const listResult = await env.DB.list({ prefix: `${ns}::` });
      console.log("list result", listResult);
      return Promise.all(
        listResult.keys
          .map((k) => k.name.slice(`${ns}::`.length))
          .map((key) => this.get(key))
      );
    },

    async delete(uuid: string) {
      return await env.DB.delete(`${ns}::${uuid}`);
    },
  };
};
