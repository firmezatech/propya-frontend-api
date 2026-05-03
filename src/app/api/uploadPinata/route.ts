import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // If using the App Router, we need to convert the stream
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const invoiceId = formData.get('invoiceId') as string;
    const propertyId = formData.get('propertyId') as string;
    const maintenanceId = formData.get('maintenanceId') as string;
    const uploadType = formData.get('uploadType') as string || 'invoice'; // default to invoice for backward compatibility
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    // Get JWT from environment variable
    const JWT = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;
    
    if (!JWT) {
      return NextResponse.json(
        { success: false, error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    // Método 1: Upload direto para a rede pública
    // Convert File to FormData for Pinata upload
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);
    
    // Add metadata based on upload type
    let metadata;
    if (uploadType === 'maintenance') {
      metadata = JSON.stringify({
        name: `Manutencao_${maintenanceId || 'temp'}_${file.name}`,
        keyvalues: {
          type: 'maintenance',
          maintenanceId: maintenanceId || 'temp',
          propertyId: propertyId || '1',
          uploadDate: new Date().toISOString()
        }
      });
    } else {
      // Default to invoice metadata
      metadata = JSON.stringify({
        name: `Boleto_${invoiceId || 'temp'}_${file.name}`,
        keyvalues: {
          type: 'invoice',
          invoiceId: invoiceId || 'temp',
          propertyId: propertyId || '1',
          uploadDate: new Date().toISOString()
        }
      });
    }
    pinataFormData.append('pinataMetadata', metadata);
    
    // Try the legacy endpoint first (which is better documented)
    // https://docs.pinata.cloud/reference/post_pinning-pinfilestoipfs
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: pinataFormData,
    });
    
    // Check if response is OK before parsing JSON
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('Erro do Pinata (resposta bruta):', errorText);
      
      let errorMessage = 'Erro desconhecido';
      try {
        // Try to parse the error as JSON if possible
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || 'Erro desconhecido';
      } catch (parseError) {
        errorMessage = errorText || 'Erro desconhecido';
      }
      
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar para IPFS: ' + errorMessage },
        { status: pinataResponse.status }
      );
    }
    
    // Parse JSON only if response is OK
    const pinataData = await pinataResponse.json();
    //console.log('Resposta do Pinata:', pinataData);
    
    // Extract IPFS hash from Pinata response
    let cid = '';
    
    if (pinataData.IpfsHash) {
      cid = pinataData.IpfsHash;
    } else if (pinataData.ipfs_pin_hash) {
      cid = pinataData.ipfs_pin_hash;
    } else if (pinataData.data && pinataData.data.IpfsHash) {
      cid = pinataData.data.IpfsHash;
    } else if (pinataData.data && pinataData.data.ipfs_pin_hash) {
      cid = pinataData.data.ipfs_pin_hash;
    } else if (pinataData.data && pinataData.data.cid) {
      cid = pinataData.data.cid;
    } else if (pinataData.hash) {
      cid = pinataData.hash;
    }
    
    if (!cid) {
      console.error('Resposta sem hash IPFS:', pinataData);
      return NextResponse.json(
        { success: false, error: 'Hash IPFS não encontrado na resposta' },
        { status: 500 }
      );
    }
    
    // Return success with IPFS hash
    const responseData: any = { 
      success: true,
      message: 'Upload realizado com sucesso',
      cid,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
      gateway_url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      propertyId: propertyId || '1'
    };

    // Add specific ID based on upload type
    if (uploadType === 'maintenance') {
      responseData.maintenanceId = maintenanceId;
    } else {
      responseData.invoiceId = invoiceId;
    }

    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Erro no servidor durante upload:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}