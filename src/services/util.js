import axios from 'axios';

export async function readJson(metadata) { 
    try {                
      return await getJson(metadata);
     
     } catch (error) {
       console.log("Error readJson: "+error);
      throw new Error(error.reason ?? error);
    }
}

async function getJson(tokenURI){
  try {
      const response = await fetch(tokenURI); 
      return response.json();
  } catch (error) {
      console.error("Erro ao obter JSON da Pinata:", error);
      return null;
  }  
}
