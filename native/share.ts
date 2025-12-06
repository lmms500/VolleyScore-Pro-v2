import { Share, CanShareResult } from '@capacitor/share';

/**
 * Compartilha um texto ou arquivo usando a funcionalidade nativa do dispositivo.
 * Adere à arquitetura de fallback, tentando a API nativa primeiro.
 *
 * @param title O título para o diálogo de compartilhamento.
 * @param text O texto a ser compartilhado.
 * @param url A URL a ser compartilhada.
 */
export const shareContentNatively = async (title: string, text: string, url: string): Promise<void> => {
  try {
    // Verifica se a funcionalidade de compartilhamento está disponível no dispositivo
    const canShareResult: CanShareResult = await Share.canShare();

    if (canShareResult.value === true) {
      // Usa o plugin nativo do Capacitor
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Compartilhar Placar da Partida',
      });
    } else {
      // Fallback para a Web Share API, se o plugin não estiver disponível
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        // Fallback final: copiar para a área de transferência se nada mais funcionar
        alert('Função de compartilhar não suportada. O link foi copiado.');
        await navigator.clipboard.writeText(url);
      }
    }
  } catch (error) {
    // Tratamento de erro robusto para o caso de o usuário cancelar o compartilhamento
    console.error('Erro ao compartilhar:', error);
    if ((error as Error).message.includes('Share canceled')) {
      // Não é um erro real, o usuário apenas fechou o diálogo. Não fazemos nada.
      return;
    }
    // Para outros erros, informa o usuário.
    alert('Ocorreu um erro inesperado ao tentar compartilhar.');
  }
};
