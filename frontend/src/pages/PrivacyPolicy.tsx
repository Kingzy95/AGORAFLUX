import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec retour */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-600 mt-2">
            Dernière mise à jour : 25 janvier 2025 - Conforme RGPD
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AgoraFlux s'engage à protéger votre vie privée et vos données personnelles. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, 
                stockons et protégeons vos informations personnelles conformément au Règlement 
                Général sur la Protection des Données (RGPD).
              </p>
            </CardContent>
          </Card>

          {/* Responsable du traitement */}
          <Card>
            <CardHeader>
              <CardTitle>2. Responsable du Traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>AgoraFlux</strong></p>
              <p>Email de contact : privacy@agoraflux.fr</p>
              <p>
                <strong>Délégué à la Protection des Données (DPO) :</strong><br />
                Email : dpo@agoraflux.fr
              </p>
            </CardContent>
          </Card>

          {/* Données collectées */}
          <Card>
            <CardHeader>
              <CardTitle>3. Données Personnelles Collectées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">3.1 Données obligatoires</h4>
              <p>Pour créer votre compte, nous collectons :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adresse email (identifiant unique)</li>
                <li>Nom et prénom</li>
                <li>Mot de passe (stocké sous forme chiffrée)</li>
              </ul>
              
              <h4 className="font-semibold">3.2 Données optionnelles</h4>
              <p>Vous pouvez choisir de fournir :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Photo de profil</li>
                <li>Biographie</li>
                <li>Localisation (ville)</li>
                <li>Site web personnel</li>
              </ul>
              
              <h4 className="font-semibold">3.3 Données techniques</h4>
              <p>Nous collectons automatiquement :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adresse IP</li>
                <li>Informations du navigateur</li>
                <li>Journaux de connexion</li>
                <li>Horodatage des actions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Finalités du traitement */}
          <Card>
            <CardHeader>
              <CardTitle>4. Finalités du Traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Vos données personnelles sont utilisées pour :</p>
              
              <h4 className="font-semibold">4.1 Fonctionnement du service</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gestion de votre compte utilisateur</li>
                <li>Authentification et sécurité</li>
                <li>Facilitation de la collaboration</li>
                <li>Fourniture des fonctionnalités de la plateforme</li>
              </ul>
              
              <h4 className="font-semibold">4.2 Communication</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Notifications liées à vos projets</li>
                <li>Informations importantes sur le service</li>
                <li>Réponses à vos demandes de support</li>
              </ul>
              
              <h4 className="font-semibold">4.3 Amélioration du service</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Analyse d'usage (données anonymisées)</li>
                <li>Détection et prévention de la fraude</li>
                <li>Amélioration de l'expérience utilisateur</li>
              </ul>
            </CardContent>
          </Card>

          {/* Base légale */}
          <Card>
            <CardHeader>
              <CardTitle>5. Base Légale du Traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Exécution du contrat :</strong> Fourniture des services demandés</li>
                <li><strong>Consentement :</strong> Données optionnelles et communications marketing</li>
                <li><strong>Intérêt légitime :</strong> Sécurité, prévention de la fraude, amélioration du service</li>
                <li><strong>Obligation légale :</strong> Conservation des journaux, signalements aux autorités</li>
              </ul>
            </CardContent>
          </Card>

          {/* Destinataires */}
          <Card>
            <CardHeader>
              <CardTitle>6. Destinataires des Données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">6.1 Accès interne</h4>
              <p>Vos données sont accessibles uniquement aux membres de notre équipe qui en ont besoin pour :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>L'administration technique de la plateforme</li>
                <li>Le support utilisateur</li>
                <li>La modération de contenu</li>
              </ul>
              
              <h4 className="font-semibold">6.2 Sous-traitants</h4>
              <p>Nous pouvons partager vos données avec des prestataires de services :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Hébergement sécurisé (France/UE)</li>
                <li>Services d'email transactionnel</li>
                <li>Outils d'analyse (données anonymisées)</li>
              </ul>
              
              <h4 className="font-semibold">6.3 Aucune vente</h4>
              <p>
                Nous ne vendons jamais vos données personnelles à des tiers à des fins commerciales.
              </p>
            </CardContent>
          </Card>

          {/* Conservation */}
          <Card>
            <CardHeader>
              <CardTitle>7. Durée de Conservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Compte actif :</strong> Tant que votre compte est actif</li>
                <li><strong>Compte supprimé :</strong> 30 jours pour restauration possible</li>
                <li><strong>Journaux de sécurité :</strong> 12 mois maximum</li>
                <li><strong>Données de facturation :</strong> Selon obligations légales (10 ans)</li>
                <li><strong>Contenu publié :</strong> Supprimé immédiatement à votre demande</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle>8. Sécurité des Données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">8.1 Mesures techniques</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                <li>Chiffrement des données au repos (AES-256)</li>
                <li>Hachage sécurisé des mots de passe (bcrypt)</li>
                <li>Sauvegardes chiffrées régulières</li>
              </ul>
              
              <h4 className="font-semibold">8.2 Mesures organisationnelles</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Accès aux données sur principe du besoin d'en connaître</li>
                <li>Formation du personnel à la protection des données</li>
                <li>Audits de sécurité réguliers</li>
                <li>Procédures de notification de violation</li>
              </ul>
            </CardContent>
          </Card>

          {/* Droits RGPD */}
          <Card>
            <CardHeader>
              <CardTitle>9. Vos Droits (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Vous disposez des droits suivants :</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">Droit d'accès</h5>
                  <p className="text-sm text-gray-600">Consulter les données que nous détenons sur vous</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Droit de rectification</h5>
                  <p className="text-sm text-gray-600">Corriger ou mettre à jour vos informations</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Droit à l'effacement</h5>
                  <p className="text-sm text-gray-600">Supprimer votre compte et vos données</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Droit à la portabilité</h5>
                  <p className="text-sm text-gray-600">Récupérer vos données dans un format lisible</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Droit d'opposition</h5>
                  <p className="text-sm text-gray-600">Vous opposer à certains traitements</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Droit à la limitation</h5>
                  <p className="text-sm text-gray-600">Limiter l'utilisation de vos données</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md mt-4">
                <h5 className="font-medium text-blue-900">Comment exercer vos droits ?</h5>
                <p className="text-sm text-blue-800 mt-2">
                  Contactez notre DPO à <strong>dpo@agoraflux.fr</strong> ou utilisez 
                  les paramètres de votre compte. Nous répondrons dans un délai de 30 jours.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>10. Cookies et Technologies Similaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">10.1 Cookies essentiels</h4>
              <p>Nécessaires au fonctionnement de la plateforme :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Session d'authentification</li>
                <li>Préférences de sécurité</li>
                <li>Protection CSRF</li>
              </ul>
              
              <h4 className="font-semibold">10.2 Cookies analytiques</h4>
              <p>
                Avec votre consentement, pour améliorer le service (données anonymisées).
              </p>
              
              <h4 className="font-semibold">10.3 Gestion des cookies</h4>
              <p>
                Vous pouvez gérer vos préférences dans les paramètres de votre compte 
                ou via les paramètres de votre navigateur.
              </p>
            </CardContent>
          </Card>

          {/* Transferts */}
          <Card>
            <CardHeader>
              <CardTitle>11. Transferts Internationaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vos données sont principalement traitées dans l'Union Européenne. 
                En cas de transfert vers un pays tiers, nous nous assurons que des 
                garanties appropriées sont en place (clauses contractuelles types, 
                décision d'adéquation).
              </p>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle>12. Modifications de cette Politique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Nous pouvons modifier cette politique de confidentialité. Les modifications 
                importantes vous seront notifiées par email et/ou via un avis sur la plateforme. 
                Votre utilisation continue du service après notification constitue une acceptation 
                des modifications.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>13. Contact et Réclamations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Pour toute question :</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email général : privacy@agoraflux.fr</li>
                <li>DPO : dpo@agoraflux.fr</li>
                <li>Support : support@agoraflux.fr</li>
              </ul>
              
              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <h5 className="font-medium text-yellow-900">Droit de réclamation</h5>
                <p className="text-sm text-yellow-800 mt-2">
                  Vous avez le droit de déposer une réclamation auprès de la CNIL 
                  (Commission Nationale de l'Informatique et des Libertés) si vous 
                  estimez que nous ne respectons pas vos droits.
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Site web :</strong> www.cnil.fr
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 