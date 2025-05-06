import { DrpcProvider } from "drpc-sdk/dist/esm/providers/zircuit";

async function getBlock(tag) {
  let provider = new DrpcProvider({
    dkey: "Ak-Z7kImikFJlIL_i3Tid5LqCV3y_X8R76CMnqSgS7QB",
    provider_ids: ["public"],
  });
  let block = await provider.getBlock(tag);
  console.log(block);
}

getBlock("latest").then((result) => {
  console.log(result);
});
