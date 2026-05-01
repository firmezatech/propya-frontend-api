// src/app/api/igpmOracle/route.ts
import { NextRequest, NextResponse } from 'next/server';
const ORACLE_API = `${process.env.NEXT_PUBLIC_ORACLE_API}`;

export type DataPackage = {
  code: number;
  licenseGroup: number;
  value: number;
  updatedAt: number;
  decimal: number;
  confidence: number;
  info: string;
  msgHash: string;
};

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ORACLE_API}/get/1003`);

    if (!response.ok) {
      return NextResponse.json(
        { message: `Erro na API: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: DataPackage = await response.json();
    
    const resultado = getDecimalValueIGMP12m(data);

    let IGPM12Meses = "Valor não disponível"; // Valor padrão

    if (data.confidence >= 60) {
      IGPM12Meses = resultado.toFixed(2); // Formata o valor com duas casas decimais
    } else {
      IGPM12Meses += ` - Confidence: ${data.confidence}`;
    }
   
    return NextResponse.json(
      { 
        ...data, 
        updatedAtString: converteData(data.updatedAt),
        igpm12m: IGPM12Meses, 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
    return NextResponse.json(
      { message: "Erro ao buscar dados do oráculo IGPM" },
      { status: 500 }
    );
  }
}


function getDecimalValueIGMP12m(dataPackage: DataPackage): number {
  return NumberFromFactor(dataPackage.value, dataPackage.decimal);
}

function getBytes(value: string | object): Uint8Array {
  if (typeof value === "string") {
    return new TextEncoder().encode(value); // Converte string para bytes UTF-8
  }

  if (typeof value === "object") {
    return new TextEncoder().encode(JSON.stringify(value)); // Converte objeto para string e depois para bytes
  }

  throw new Error("Tipo de dado inválido. Esperado string ou objeto.");
}

function NumberFromFactor(num: number, decimal: number) {
  return num && decimal ? num / Math.pow(10, decimal) : num;
}

function converteData(data: number): string {
  let updateAtMillis = data * 10000;
  const newDate = new Date(updateAtMillis);

  let formattedDate =
    newDate.getUTCDate().toString().padStart(2, "0") +
    "/" +
    (newDate.getUTCMonth() + 1).toString().padStart(2, "0") +
    "/" +
    newDate.getUTCFullYear();

  return formattedDate;
}