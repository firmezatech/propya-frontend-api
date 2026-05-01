"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserType, listUser } from "../../../../services/login-fmz-api";
import { useProfile } from '../../../context/ProfileContext';

export default function UsersList() {
  const router = useRouter();
  
  const { profile, setCurrentProfile } = useProfile();
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<UserType[] | null>([]); 

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet && !wallet) {
      setWallet(storedWallet);
    }

    const fetchData = async () => {
      try {
        const response = await listUser();

        if (!response.success || !response.users || response.users.length === 0) {
          setMessage(response.message || "Não há dados");
          setUsers([]);
        } else {
          setUsers(response.users);
        }
      } catch (err) {
        console.error("Erro carregando dados da API", err);
        setMessage("Erro carregando dados da API");
      }
    };

    if (wallet) {
      fetchData();
    }
  }, [wallet, profile]);

  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
            &larr; Voltar
          </button>
        </div>

        <h1 className="text-2xl font-semibold mb-4">Lista de Usuarios </h1>

        {users && users.length > 0 ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.wallet}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
              {message || "Carregando dados..."}
            </div>
          )}
      </main>
    </div>
  );
}