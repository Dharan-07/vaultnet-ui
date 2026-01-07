import { ethers } from 'ethers';
import { logger } from '@/lib/logger';

// VaultNet Contract Configuration
const CONTRACT_ADDRESS = '0x90DCb7bAA3c1D67eCF0B40B892D4198BC0c1E024';

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'cid', type: 'string' }, { internalType: 'uint256', name: 'price', type: 'uint256' }],
    name: 'uploadModel',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'modelId', type: 'uint256' }],
    name: 'buyModel',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'modelId', type: 'uint256' }, { internalType: 'string', name: 'newCid', type: 'string' }],
    name: 'updateModel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'models',
    outputs: [
      { internalType: 'address', name: 'uploader', type: 'address' },
      { internalType: 'string', name: 'cid', type: 'string' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint256', name: 'version', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'modelCounter',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Types for the smart contract
export interface ModelData {
  id: number;
  uploader: string;
  cid: string;
  price: string;
  version: number;
  exists: boolean;
}

// Web3 connection state
let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let userAddress: string | null = null;

function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

export async function connectWallet(): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this dApp.');
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    const network = await provider.getNetwork();
    const SEPOLIA_CHAIN_ID = 11155111n;
    
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      throw new Error('Please switch to Sepolia testnet in MetaMask');
    }

    return userAddress;
  } catch (error: unknown) {
    logger.error('Error connecting wallet:', error);
    throw error;
  }
}

export function getWalletAddress(): string | null {
  return userAddress;
}

export async function getBalance(): Promise<string> {
  if (!provider || !userAddress) {
    throw new Error('Wallet not connected');
  }
  
  const balance = await provider.getBalance(userAddress);
  return ethers.formatEther(balance);
}

export async function uploadModel(
  cid: string,
  price: string
): Promise<{ success: boolean; txHash?: string; modelId?: number; error?: string }> {
  try {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getContract(signer);
    const priceInWei = ethers.parseEther(price);
    const tx = await contract.uploadModel(cid, priceInWei);
    const receipt = await tx.wait();
    
    // Get modelId from event logs
    const modelId = receipt.logs[0]?.args?.[0];

    return {
      success: true,
      txHash: receipt.hash,
      modelId: modelId ? Number(modelId) : undefined,
    };
  } catch (error: unknown) {
    logger.error('Error uploading model:', error);
    const err = error as { reason?: string; message?: string };
    return {
      success: false,
      error: err.reason || err.message || 'Failed to upload model',
    };
  }
}

export async function getModelCount(): Promise<number> {
  try {
    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    const contract = getContract(provider);
    const count = await contract.modelCounter();
    return Number(count);
  } catch (error) {
    logger.error('Error getting model count:', error);
    return 0;
  }
}

export async function getModel(modelId: number): Promise<ModelData | null> {
  try {
    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    const contract = getContract(provider);
    const model = await contract.models(modelId);
    
    if (!model.exists) {
      return null;
    }

    return {
      id: modelId,
      uploader: model.uploader,
      cid: model.cid,
      price: ethers.formatEther(model.price),
      version: Number(model.version),
      exists: model.exists,
    };
  } catch (error) {
    logger.error('Error getting model:', error);
    return null;
  }
}

export async function buyModelAccess(
  modelId: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!signer || !provider) {
      throw new Error('Wallet not connected');
    }

    const contract = getContract(provider);
    const model = await contract.models(modelId);
    
    if (!model.exists) {
      throw new Error('Model not found');
    }

    const contractWithSigner = getContract(signer);
    const tx = await contractWithSigner.buyModel(modelId, { value: model.price });
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error: unknown) {
    logger.error('Error buying model:', error);
    const err = error as { reason?: string; message?: string };
    return {
      success: false,
      error: err.reason || err.message || 'Failed to buy model',
    };
  }
}

export async function updateModel(
  modelId: number,
  newCid: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getContract(signer);
    const tx = await contract.updateModel(modelId, newCid);
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error: unknown) {
    logger.error('Error updating model:', error);
    const err = error as { reason?: string; message?: string };
    return {
      success: false,
      error: err.reason || err.message || 'Failed to update model',
    };
  }
}

export async function getAllModels(): Promise<ModelData[]> {
  try {
    const count = await getModelCount();
    const models: ModelData[] = [];
    
    for (let i = 1; i <= count; i++) {
      const model = await getModel(i);
      if (model) {
        models.push(model);
      }
    }
    
    return models;
  } catch (error) {
    logger.error('Error getting all models:', error);
    return [];
  }
}

// Listen for account changes
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      userAddress = null;
      signer = null;
    } else {
      userAddress = accounts[0];
      connectWallet().catch((error) => logger.error('Error reconnecting wallet:', error));
    }
  });

  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
