import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const TermsOfService: React.FC = () => {
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
            Conditions d'Utilisation
          </h1>
          <p className="text-gray-600 mt-2">
            Dernière mise à jour : 25 janvier 2025
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
                Bienvenue sur AgoraFlux, une plateforme de collaboration citoyenne qui permet 
                aux citoyens de participer activement à l'amélioration de leur ville en 
                travaillant sur des projets basés sur des données publiques.
              </p>
              <p>
                En utilisant notre service, vous acceptez d'être lié par ces conditions 
                d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas 
                utiliser notre service.
              </p>
            </CardContent>
          </Card>

          {/* Acceptation des conditions */}
          <Card>
            <CardHeader>
              <CardTitle>2. Acceptation des Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                En accédant et en utilisant AgoraFlux, vous reconnaissez avoir lu, 
                compris et accepté d'être lié par ces conditions d'utilisation ainsi 
                que par notre politique de confidentialité.
              </p>
              <p>
                Nous nous réservons le droit de modifier ces conditions à tout moment. 
                Les modifications prendront effet dès leur publication sur cette page.
              </p>
            </CardContent>
          </Card>

          {/* Comptes utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle>3. Comptes Utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">3.1 Création de compte</h4>
              <p>
                Pour utiliser certaines fonctionnalités, vous devez créer un compte. 
                Vous êtes responsable de maintenir la confidentialité de vos informations 
                de connexion.
              </p>
              
              <h4 className="font-semibold">3.2 Exigences de mot de passe</h4>
              <p>Votre mot de passe doit respecter les critères suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Au minimum 8 caractères</li>
                <li>Au moins 1 lettre majuscule (A-Z)</li>
                <li>Au moins 1 lettre minuscule (a-z)</li>
                <li>Au moins 1 chiffre (0-9)</li>
                <li>Au moins 1 caractère spécial (!@#$%^&*)</li>
              </ul>
              
              <h4 className="font-semibold">3.3 Responsabilités</h4>
              <p>
                Vous êtes responsable de toutes les activités effectuées sous votre compte. 
                Vous devez nous notifier immédiatement de toute utilisation non autorisée.
              </p>
            </CardContent>
          </Card>

          {/* Utilisation acceptable */}
          <Card>
            <CardHeader>
              <CardTitle>4. Utilisation Acceptable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">4.1 Comportement attendu</h4>
              <p>En utilisant AgoraFlux, vous vous engagez à :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Respecter les autres utilisateurs</li>
                <li>Fournir des informations exactes et à jour</li>
                <li>Utiliser la plateforme uniquement à des fins légales</li>
                <li>Respecter la propriété intellectuelle d'autrui</li>
                <li>Maintenir un environnement constructif</li>
              </ul>
              
              <h4 className="font-semibold">4.2 Comportements interdits</h4>
              <p>Il est strictement interdit de :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Publier du contenu illégal, offensant ou discriminatoire</li>
                <li>Harceler ou intimider d'autres utilisateurs</li>
                <li>Usurper l'identité d'une autre personne</li>
                <li>Diffuser des informations fausses ou trompeuses</li>
                <li>Tenter de compromettre la sécurité de la plateforme</li>
                <li>Utiliser des robots ou scripts automatisés</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contenu utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle>5. Contenu Utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">5.1 Propriété du contenu</h4>
              <p>
                Vous conservez la propriété du contenu que vous publiez sur AgoraFlux. 
                Cependant, en publiant du contenu, vous nous accordez une licence non 
                exclusive pour l'utiliser dans le cadre de notre service.
              </p>
              
              <h4 className="font-semibold">5.2 Responsabilité</h4>
              <p>
                Vous êtes seul responsable du contenu que vous publiez. Nous nous 
                réservons le droit de modérer, modifier ou supprimer tout contenu 
                qui viole ces conditions.
              </p>
            </CardContent>
          </Card>

          {/* Données et confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle>6. Données et Confidentialité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">6.1 Collecte de données</h4>
              <p>
                Nous collectons uniquement les données nécessaires au fonctionnement 
                de notre service, conformément à notre politique de confidentialité 
                et au RGPD.
              </p>
              
              <h4 className="font-semibold">6.2 Utilisation des données</h4>
              <p>
                Vos données personnelles sont utilisées uniquement pour :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fournir et améliorer nos services</li>
                <li>Faciliter la collaboration entre utilisateurs</li>
                <li>Vous envoyer des notifications pertinentes</li>
                <li>Assurer la sécurité de la plateforme</li>
              </ul>
            </CardContent>
          </Card>

          {/* Modération */}
          <Card>
            <CardHeader>
              <CardTitle>7. Modération et Sanctions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">7.1 Processus de modération</h4>
              <p>
                Notre équipe de modération surveille le contenu pour assurer le 
                respect de ces conditions. Les actions de modération incluent :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Avertissements</li>
                <li>Masquage de contenu</li>
                <li>Suspension temporaire</li>
                <li>Suppression définitive de compte</li>
              </ul>
              
              <h4 className="font-semibold">7.2 Recours</h4>
              <p>
                Si vous estimez qu'une action de modération est injustifiée, 
                vous pouvez contacter notre équipe à support@agoraflux.fr.
              </p>
            </CardContent>
          </Card>

          {/* Limitation de responsabilité */}
          <Card>
            <CardHeader>
              <CardTitle>8. Limitation de Responsabilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AgoraFlux est fourni "en l'état" sans garantie d'aucune sorte. 
                Nous ne pouvons garantir que le service sera exempt d'erreurs 
                ou disponible en permanence.
              </p>
              <p>
                Notre responsabilité est limitée dans la mesure maximale 
                autorisée par la loi applicable.
              </p>
            </CardContent>
          </Card>

          {/* Résiliation */}
          <Card>
            <CardHeader>
              <CardTitle>9. Résiliation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vous pouvez cesser d'utiliser nos services à tout moment. 
                Nous nous réservons le droit de suspendre ou résilier votre 
                accès en cas de violation de ces conditions.
              </p>
              <p>
                En cas de résiliation, certaines dispositions de ces conditions 
                continueront de s'appliquer.
              </p>
            </CardContent>
          </Card>

          {/* Droit applicable */}
          <Card>
            <CardHeader>
              <CardTitle>10. Droit Applicable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Ces conditions sont régies par le droit français. Tout litige 
                sera soumis à la compétence des tribunaux français.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>11. Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Pour toute question concernant ces conditions d'utilisation, 
                vous pouvez nous contacter :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email : support@agoraflux.fr</li>
                <li>Email juridique : legal@agoraflux.fr</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 