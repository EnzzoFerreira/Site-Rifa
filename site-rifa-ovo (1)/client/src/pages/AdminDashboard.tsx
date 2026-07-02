import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: reservations, isLoading: reservationsLoading } = trpc.rifa.getReservations.useQuery();
  const { data: payments, isLoading: paymentsLoading } = trpc.rifa.getPayments.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">Você precisa estar autenticado para acessar o painel de admin</p>
          <Button>Fazer Login</Button>
        </Card>
      </div>
    );
  }

  const confirmedReservations = reservations?.filter(r => r.paymentStatus === 'confirmed') || [];
  const pendingReservations = reservations?.filter(r => r.paymentStatus === 'pending') || [];
  const totalRevenue = confirmedReservations.reduce((sum, r) => sum + r.paymentAmount, 0) / 100; // Converter de centavos para reais
  const totalParticipants = confirmedReservations.length;

  const statusData = [
    { name: 'Confirmados', value: confirmedReservations.length, fill: '#22c55e' },
    { name: 'Pendentes', value: pendingReservations.length, fill: '#f59e0b' },
  ];

  const revenueData = [
    { name: 'Arrecadado', value: totalRevenue },
    { name: 'Meta (R$ 2000)', value: 2000 - totalRevenue },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Painel de Admin - Rifa de Páscoa
        </h1>
        <p className="text-muted-foreground mb-8">Bem-vindo, {user?.name}! Acompanhe as vendas em tempo real.</p>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Arrecadado</p>
                <p className="text-3xl font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Números Vendidos</p>
                <p className="text-3xl font-bold text-foreground">{totalParticipants}/200</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Participantes</p>
                <p className="text-3xl font-bold text-foreground">{new Set(confirmedReservations.map(r => r.email)).size}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Progresso</p>
                <p className="text-3xl font-bold text-foreground">{Math.round((totalParticipants / 200) * 100)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Status das Reservas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Arrecadação</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Reservations Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Reservas Confirmadas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Número</th>
                  <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Nome</th>
                  <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Email</th>
                  <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Telefone</th>
                  <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Valor</th>
                  <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {confirmedReservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-semibold text-foreground">{reservation.number}</td>
                    <td className="py-3 px-4 text-foreground">{reservation.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{reservation.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{reservation.phone}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">R$ {(reservation.paymentAmount / 100).toFixed(2)}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(reservation.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
