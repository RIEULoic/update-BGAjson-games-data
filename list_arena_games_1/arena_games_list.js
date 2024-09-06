const axios = require("axios");
const { convertXML } = require("simple-xml-to-json");
const fs = require("fs");

const BGA_FAMILY_URL = "https://boardgamegeek.com/xmlapi2/family?id=70360";

async function getBgaList() {
  try {
    const response = await axios.get(BGA_FAMILY_URL);
    // console.log(response.data);
    const xmlData = response.data;
    const jsonData = convertXML(xmlData);

    // console.log(
    //   jsonData.items.children[0].item.children.filter(
    //     (item) => item.link && item.link.inbound === "true"
    //   )
    // );

    const filteredItems = jsonData.items.children[0].item.children
      .filter((item) => item.link && item.link.inbound === "true")
      .map((item) => ({
        id: item.link.id,
        name: item.link.value,
      })); //Il faut mettre des () pour retourner un objet littéral du genre {id: item.link.id, value: item.value}. Sinon, il va croire que c'est une fonction et retourner undefined

    // Convertir les données JSON en chaîne de caractères pour pouvoir les écrire dans un fichier
    const jsonString = JSON.stringify(filteredItems, null, 2);
    // Les attributs de la méthode stringify sont là pour formater le JSON de manière lisible : le 2 pour l'indentation de 2 espaces

    //fs.writeFile permet d'écrire dans un fichier. Il prend en paramètre le nom du fichier, le contenu à écrire et une fonction de callback qui prend en paramètre une erreur si elle existe
    fs.writeFile("arena-games-list.json", jsonString, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Fichier JSON créé avec succès");
    });
  } catch (error) {
    console.error(error);
  }
}

getBgaList();
