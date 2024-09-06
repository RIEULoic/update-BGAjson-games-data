const axios = require("axios");
const fs = require("fs");
const { convertXML } = require("simple-xml-to-json");

const arenaGamesList = JSON.parse(
  fs.readFileSync("arena-games-list.json", "utf-8")
);
const arenaGamesData = [];

async function scrapGames() {
  for (let i = 0; i <= arenaGamesList.length; i += 20) {
    try {
      const ids = arenaGamesList
        .slice(i, i + 20) // Créer un sous-tableau de 20 éléments à partir de l'index i
        .map((game) => game.id) // Transformer chaque élément en son ID
        .join(); // Joindre les IDs par des virgules pour former une chaîne

      const response = await axios.get(
        `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`
      );

      const convertedData = convertXML(response.data);

      const filteredData = cleaningData(convertedData);

      arenaGamesData.push(...filteredData);
      //...filteredData signifie que chaque élément de filteredData est ajouté au tableau arenaGamesData. Si je faisais seulement arenaGamesData.push(filteredData), cela ajouterait un tableau à l'intérieur du tableau arenaGamesData.

      console.log("Data added to arenaGamesData : ", i + 20);
    } catch (error) {
      console.error(error);
    }
  }
}

function cleaningData(rawData) {
  const getChildValue = (children, key) =>
    children.find((child) => child[key])?.[key]?.value;

  const getChildContent = (children, key) =>
    children.find((child) => child[key])?.[key]?.content;

  const getLinks = (children, type) =>
    children
      .filter((child) => child.link && child.link.type === type)
      .map((child) => child.link);

  const getStatistics = (children) => {
    const stats = children.find((child) => child.statistics)?.statistics
      .children[0]?.ratings.children;
    return stats;
  };

  const cleanData = rawData.items.children
    .filter((game) => game.item.type === "boardgame")
    .map((game) => {
      const { children } = game.item;

      const geekId = game.item.id;
      const name = getChildValue(children, "name");
      const image = getChildContent(children, "image");
      const minPlayers = getChildValue(children, "minplayers");
      const maxPlayers = getChildValue(children, "maxplayers");

      const gameCategoryLinks = getLinks(children, "boardgamecategory");
      const gameMechanicLinks = getLinks(children, "boardgamemechanic");
      const designersLinks = getLinks(children, "boardgamedesigner");
      const artistsLinks = getLinks(children, "boardgameartist");
      const publishersLinks = getLinks(children, "boardgamepublisher");

      const stats = getStatistics(children);

      const geekAverage = getChildValue(stats, "average");
      const geekComplexity = getChildValue(stats, "averageweight");

      const geekRank = stats
        .find((child) => child.ranks)
        ?.ranks.children.map((child) => ({
          rankId: child.rank.id,
          rankName: child.rank.name,
          rankFriendlyName: child.rank.friendlyname,
          rankValue: child.rank.value,
        }));

      return {
        geekId,
        name,
        image,
        minPlayers,
        maxPlayers,
        gameCategoryLinks,
        gameMechanicLinks,
        designersLinks,
        artistsLinks,
        publishersLinks,
        geekAverage,
        geekRank,
        geekComplexity,
      };
    });
  return cleanData;
}

function arenaGamesDataJSON() {
  fs.writeFile(
    "arena-games-data.json",
    JSON.stringify(arenaGamesData, null, 2),
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Fichier arena-games-data.json créé avec succès");
    }
  ); // Écrire les données dans un fichier JSON
}

async function main() {
  await scrapGames(); // Attendre la fin du scraping
  arenaGamesDataJSON(); // Sauvegarder dans un fichier JSON les datas
}

main();
