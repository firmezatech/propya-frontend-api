import { ethers } from "ethers";

const CHAIN_ID: number = parseInt(process.env.CHAIN_ID || "0");

async function getProvider() {
  if (!window.ethereum) throw new Error("Carteira não encontrada!");
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
}

export const login = async (): Promise<string | null> => {
  try {
    const account = await connectMetaMask(); // Call the existing connectMetaMask function
    return account; // Return the connected account
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Login failed: " + (error as Error).message);
  }
};

//================================= Função de Login
declare global {
  interface Window {
    web3?: any; // ou qualquer tipo específico que você prefira
  }
}
// Verifica se o MetaMask está instalado
export const checkMetaMaskInstalled = (): any | boolean => {
  if (typeof window.ethereum !== "undefined") {
    // MetaMask está disponível
    const provider = window.ethereum;
    return provider;
  } else if (typeof window.web3 !== "undefined") {
    // Suporte para versões antigas do MetaMask
    const provider = window.web3.currentProvider;
    return provider;
  } else {
    //console.error("MetaMask não detectado!");
    return false;
  }
};

// Conecta à MetaMask e retorna a conta conectada
export const connectMetaMask = async (): Promise<string | null> => {
  try {
    const provider = checkMetaMaskInstalled();
    if (!provider) {
    //  console.error("MetaMask não detectado no navegador");
      throw new Error("MetaMask não está instalado.");
    }
   // console.log("MetaMask detectado, verificando rede...");

    // Verifica se está conectado à rede correta
    await checkConnectedNetwork();
   // console.log("Rede verificada com sucesso");

    // Solicita acesso às contas
   // console.log("Solicitando acesso às contas...");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts.length) {
     // console.error("Nenhuma conta encontrada ou permissão negada");
      throw new Error("Carteira não permitida ou não encontrada!");
    }
   // console.log("Conta encontrada:", accounts[0]);

    try {
      // Solicita assinatura de mensagem para autenticação
    //  console.log("Solicitando assinatura de mensagem...");
      const message = "FIRMEZA TOKEN. Acesso seguro (apenas visualização)";
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [accounts[0], message],
      });
    //  console.log("Assinatura obtida com sucesso");
    } catch (error) {
      console.log("Erro ao solicitar permissão ou assinatura:", {
        error,
        account: accounts[0]
      });
      throw new Error("Erro ao solicitar permissão ou assinatura.");
    }

    // console.log("Carteira conectada com sucesso:", {
    //   account: accounts[0],
    //   network: await window.ethereum.request({ method: "eth_chainId" })
    // });
    return accounts[0];
  } catch (error) {
    console.log("Erro ao conectar MetaMask:", {
      error,
      timestamp: new Date().toISOString()
    });
    throw new Error("Erro ao conectar à MetaMask: " + (error as Error).message);
  }
};

// Desconectar MetaMask (pode ser apenas uma função que limpa os dados no frontend)
export const disconnectMetaMask = () => {
  return null;
};

// Função para verificar se a rede conectada é a Sepolia
export const checkConnectedNetwork = async (): Promise<void> => {
  try {
    const networkChainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    const connectedChainId = parseInt(networkChainId, 16); // Hexadecimal para decimal

    if (connectedChainId !== CHAIN_ID) {
      throw new Error(
        `Conecte-se à rede Sepolia (ID: ${CHAIN_ID}). O ID da rede atual é ${connectedChainId}.`
      );
    }
  } catch (error) {
    console.log("Erro ao verificar a rede:", error);
    throw error;
  }
};

// Função para tratar mudança de conta
export const onAccountAndNetworkChanged = (
  accountCallback: (account: string | null) => void,
  networkCallback: (isCorrectNetwork: boolean) => void
) => {
  if (checkMetaMaskInstalled()) {
    // Monitorar mudança de contas
    window.ethereum.on("accountsChanged", async (accounts: string[]) => {
      try {
        await checkConnectedNetwork();

        // Se contas estiverem disponíveis, chama o callback com a primeira conta
        if (accounts.length > 0) {
          accountCallback(accounts[0]);
        } else {
          // Se não houver contas, chama o callback com null (desconectado)
          accountCallback(null);
        }
      } catch (error) {
        console.log("Erro durante a troca de contas:", error);
        accountCallback(null); // Opcionalmente desconectar ou lidar com o erro
      }
    });

    // Monitorar mudança de rede (chainChanged)
    window.ethereum.on("chainChanged", async (networkChainId: string) => {
      try {
        const connectedChainId = parseInt(networkChainId, 16); // Hexadecimal para decimal

        const isCorrectNetwork = connectedChainId === CHAIN_ID;

        if (!isCorrectNetwork) {
          console.log(
            `Conecte-se à rede ID: ${CHAIN_ID}. Atual: ${connectedChainId}`
          );
        }

        // Callback para notificar se a rede está correta ou não
        networkCallback(isCorrectNetwork);
      } catch (error) {
        console.log("Erro ao verificar mudança de rede:", error);
        networkCallback(false); // Notificar que houve um erro e a rede não está correta
      }
    });
  }
};
