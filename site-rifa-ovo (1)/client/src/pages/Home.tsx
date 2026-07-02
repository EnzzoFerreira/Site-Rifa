import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Gift, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

/**
 * Rifa do Ovo de Chocolate - Elegant Festive Modern Design
 * Color Palette: Gold (#D4AF37), Dark Chocolate (#3E2723), Cream (#F5E6D3)
 * Typography: Playfair Display (titles), Poppins (headings), Inter (body)
 */

interface ReservedNumber {
  number: number;
  name: string;
  email: string;
  phone: string;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalNumbers = 200;
  const pricePerNumber = 10;
  const pixKey = 'michellepirillo@hotmail.com';
  const whatsappNumber = '+5511953396464';
  const whatsappMessage = 'Pagamento Efetuado ✅';
  const qrCodeUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663335152995/mgY7HJBapD3Ceb3w7CQac8/pasted_file_WNMBSA_image_4abbe986.png';
  const ovoImageUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663335152995/mgY7HJBapD3Ceb3w7CQac8/WhatsAppImage2026-03-02at22.17.00_320231de.jpeg';

  // Fetch reserved numbers and reservations from database
  const { data: reservedNumbersData, isLoading: reservedNumbersLoading, refetch: refetchReservedNumbers } = trpc.rifa.getReservedNumbers.useQuery(undefined, {
    refetchInterval: 2000, // Atualizar a cada 2 segundos para mais responsividade
  });
  const { data: reservationsData, isLoading: reservationsLoading, refetch: refetchReservations } = trpc.rifa.getReservations.useQuery(undefined, {
    refetchInterval: 2000, // Atualizar a cada 2 segundos para mais responsividade
  });
  const createReservationMutation = trpc.rifa.createReservation.useMutation();
  const confirmPaymentMutation = trpc.rifa.confirmPayment.useMutation();

  const reservedNumbers = reservedNumbersData || [];
  const reservations = reservationsData || [];
  
  // Criar mapa de números para informações dos participantes
  const reservationsByNumber = useMemo(() => {
    const map: Record<number, typeof reservations[0]> = {};
    reservations.forEach(res => {
      if (res.paymentStatus === 'confirmed') {
        map[res.number] = res;
      }
    });
    return map;
  }, [reservations]);
  
  // Calcular estatísticas
  const confirmedReservations = useMemo(() => {
    return reservations.filter(r => r.paymentStatus === 'confirmed');
  }, [reservations]);
  const totalArrecadado = confirmedReservations.length * pricePerNumber;

  const availableNumbers = useMemo(() => {
    return Array.from({ length: totalNumbers }, (_, i) => i + 1).filter(
      num => !reservedNumbers.includes(num)
    );
  }, [reservedNumbers]);

  const handleNumberClick = (num: number) => {
    if (reservedNumbers.includes(num)) return;
    
    setSelectedNumbers(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Selecione pelo menos um número');
      return;
    }
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsDialogOpen(false);
    setShowPaymentModal(true);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleQrScanned = () => {
    setQrScanned(true);
    toast.success('QR Code escaneado com sucesso!');
  };

  const handleConfirmPayment = async () => {
    // Validar se pelo menos um número foi selecionado
    if (selectedNumbers.length === 0) {
      toast.error('Selecione pelo menos um número');
      return;
    }
    
    if (!qrScanned) {
      toast.error('Por favor, escaneie o QR Code primeiro');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create reservation for each selected number
      for (const number of selectedNumbers) {
        await createReservationMutation.mutateAsync({
          number,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pixKey,
          paymentAmount: pricePerNumber * 100, // Convert to cents
        });
      }
      
      // Limpar seleção e formulario
      setSelectedNumbers([]);
      setFormData({ name: '', email: '', phone: '' });
      setShowPaymentModal(false);
      setQrScanned(false);
      setPaymentConfirmed(true);

      toast.success(`${selectedNumbers.length} número(s) reservado(s) com sucesso! Os números estão agora indisponíveis.`);

      // Forçar atualização imediata dos números reservados
      await refetchReservedNumbers();
      await refetchReservations();

      // Fechar modal de sucesso após 3 segundos
      setTimeout(() => {
        setPaymentConfirmed(false);
        refetchReservedNumbers();
        refetchReservations();
      }, 3000);
    } catch (error) {
      toast.error('Erro ao processar a reserva. Tente novamente.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalValue = selectedNumbers.length * pricePerNumber;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Rifa de Páscoa
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Ajude os formandos da 3A! Concorra a um ovo Lacreme 2kg
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                  <Gift className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prêmio</p>
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>Ovo Lacreme 2kg + Tabletes ao Leite</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                  <DollarSign className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor da Cota</p>
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>R$ 10,00</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                  <Calendar className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Sorteio</p>
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>01 de Abril de 2026</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="elegant-button w-full md:w-auto text-base"
                >
                  Escolher Números
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center items-center">
              <div className="relative w-full max-w-sm">
                <img
                  src={ovoImageUrl}
                  alt="Ovo Lacreme 2kg"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex justify-center py-8">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663335152995/mgY7HJBapD3Ceb3w7CQac8/golden-divider-RU9iacKWXrYeDA5DQArk5T.webp"
          alt="Divider"
          className="h-12 w-auto opacity-80"
        />
      </div>

      {/* Numbers Grid Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Escolha seus Números da Sorte
            </h2>
            <div className="space-y-2">
              <p className="text-muted-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Disponíveis: {availableNumbers.length} | Reservados: {reservedNumbers.length} | Total: {totalNumbers}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 md:p-8 border border-border">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
              {Array.from({ length: totalNumbers }, (_, i) => i + 1).map(num => {
                const isReserved = reservedNumbers.includes(num);
                const isSelected = selectedNumbers.includes(num);
                const reservation = reservationsByNumber[num];

                return (
                  <div key={num} className="relative group">
                    <button
                      onClick={() => handleNumberClick(num)}
                      disabled={isReserved}
                      className={`
                        number-card transition-all duration-300 w-full
                        ${isReserved ? 'reserved' : isSelected ? 'selected' : 'available'}
                        ${!isReserved && 'hover:scale-110'}
                      `}
                      title={reservation ? `Reservado por ${reservation.name}` : ''}
                    >
                      {num}
                    </button>
                    {/* Tooltip com informações do participante */}
                    {isReserved && reservation && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-semibold text-foreground">{reservation.name}</p>
                        <p className="text-muted-foreground text-xs">Reservado</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-muted bg-card"></div>
                <span className="text-muted-foreground">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-primary bg-primary"></div>
                <span className="text-muted-foreground">Selecionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-muted bg-muted"></div>
                <span className="text-muted-foreground">Reservado (passe o mouse para ver o nome)</span>
              </div>
            </div>
            
            {(reservedNumbersLoading || reservationsLoading) && (
              <div className="mt-4 text-center text-muted-foreground text-sm">
                Atualizando números reservados...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Regulations Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            Regulamento
          </h2>

          <Tabs defaultValue="regras" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regras">Regras</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="regras" className="space-y-4 mt-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Condições Gerais
                </h3>
                <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
                  <li>• A rifa consiste em 200 números, de 1 a 200</li>
                  <li>• Cada número custa R$ 10,00</li>
                  <li>• O sorteio será realizado em 01 de Abril de 2026</li>
                  <li>• O prêmio é um Ovo Lacreme 2kg acompanhado de tabletes ao leite</li>
                  <li>• Apenas um número pode ser sorteado como vencedor</li>
                  <li>• A arrecadação é destinada às camisetas dos formandos da 3A</li>
                  <li>• O resultado será divulgado no Instagram @jlr.terceiraoa</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Pagamento
                </h3>
                <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
                  <li>• Aceitamos pagamento via Pix</li>
                  <li>• A reserva é confirmada após o pagamento</li>
                  <li>• Você receberá confirmação por email</li>
                  <li>• Não são aceitos reembolsos após a confirmação</li>
                  <li>• Contato: (15) 99647-3140 ou @jlr.terceiraoa no Instagram</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Responsabilidade
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  A organização não se responsabiliza por problemas técnicos ou falhas de comunicação.
                  Todas as transações são registradas e podem ser consultadas.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4 mt-6">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Como funciona a rifa?
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  Você escolhe um ou mais números, realiza o pagamento via Pix e aguarda o sorteio.
                  Se seu número for sorteado, você ganha o Ovo Lacreme 2kg com tabletes ao leite!
                  Toda a arrecadação vai para as camisetas dos formandos da 3A.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Posso escolher vários números?
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  Sim! Você pode escolher quantos números desejar. Quanto mais números você escolher,
                  maiores são suas chances de ganhar.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Como faço o pagamento?
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  Após escolher seus números, você será direcionado para a tela de pagamento onde
                  poderá copiar a chave Pix e realizar a transferência.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Como saberei se ganhei?
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  O resultado será divulgado no Instagram @jlr.terceiraoa e você também receberá
                  uma notificação por email com o resultado.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Dialog - Reservation Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>Dados da Reserva</DialogTitle>
            <DialogDescription>
              Preencha seus dados para reservar os números selecionados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-2"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Números selecionados:</p>
              <p className="font-semibold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {selectedNumbers.sort((a, b) => a - b).join(', ')}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Total: {selectedNumbers.length} número(s) × R$ {pricePerNumber.toFixed(2)} = <span className="font-semibold text-foreground">R$ {totalValue.toFixed(2)}</span>
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReserve}
                className="elegant-button flex-1"
              >
                Continuar para Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>Pagamento via Pix</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code e confirme o pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar:</p>
              <p className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                R$ {totalValue.toFixed(2)}
              </p>
            </div>

            {/* QR Code Section */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Escaneie o QR Code:</p>
              <div className="flex justify-center bg-card p-4 rounded-lg border border-border">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Pix"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <Button
                onClick={handleQrScanned}
                variant={qrScanned ? "default" : "outline"}
                className="w-full"
              >
                {qrScanned ? '✓ QR Code Escaneado' : 'Clique aqui após escanear'}
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground">OU</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Pix Key Section */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Chave Pix (Email):</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-card border border-border rounded-lg p-3 font-mono text-sm break-all">
                  {pixKey}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyPixKey}
                  className="flex-shrink-0"
                >
                  {copiedPix ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Instruções:</strong> Escaneie o QR Code com seu celular ou copie a chave Pix acima.
                Após realizar o pagamento, clique em "Já Paguei" para confirmar.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setQrScanned(false);
                }}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={!qrScanned || isSubmitting}
                className="elegant-button flex-1"
              >
                {isSubmitting ? 'Processando...' : qrScanned ? 'Já Paguei' : 'Confirme após escanear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Payment Success */}
      <Dialog open={paymentConfirmed} onOpenChange={setPaymentConfirmed}>
        <DialogContent className="max-w-md text-center">
          <div className="py-8 space-y-4">
            <div className="text-6xl">✓</div>
            <h2 className="text-3xl font-bold text-green-600" style={{ fontFamily: "'Playfair Display', serif" }}>Pagamento Efetuado!</h2>
            <p className="text-muted-foreground text-lg">
              Seus números foram reservados com sucesso!
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta janela e voltar a visualizar os números disponíveis.
            </p>
            <Button
              onClick={() => setPaymentConfirmed(false)}
              className="elegant-button w-full mt-6"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
