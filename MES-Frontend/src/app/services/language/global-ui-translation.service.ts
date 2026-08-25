import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { SupportedLanguage } from './language.service';

type UiLanguage = Exclude<SupportedLanguage, 'en'>;
type TranslationSet = Record<UiLanguage, string>;

/**
 * Translates legacy hard-coded UI text without changing business data.
 * New screens should still prefer ngx-translate keys in their templates.
 */
@Injectable({ providedIn: 'root' })
export class GlobalUiTranslationService implements OnDestroy {
  private observer?: MutationObserver;
  private languageSubscription?: Subscription;
  private readonly originalText = new WeakMap<Text, string>();
  private readonly originalAttributes = new WeakMap<Element, Map<string, string>>();
  private started = false;

  private readonly exact: Record<string, TranslationSet> = {
    'Submit': { fr: 'Envoyer', de: 'Absenden', nl: 'Verzenden' },
    'Cancel': { fr: 'Annuler', de: 'Abbrechen', nl: 'Annuleren' },
    'Success': { fr: 'Succès', de: 'Erfolg', nl: 'Succes' },
    'Error': { fr: 'Erreur', de: 'Fehler', nl: 'Fout' },
    'User List': { fr: 'Liste des utilisateurs', de: 'Benutzerliste', nl: 'Gebruikerslijst' },
    'Username': { fr: "Nom d’utilisateur", de: 'Benutzername', nl: 'Gebruikersnaam' },
    'Email': { fr: 'E-mail', de: 'E-Mail', nl: 'E-mail' },
    'Role': { fr: 'Rôle', de: 'Rolle', nl: 'Rol' },
    'Status': { fr: 'Statut', de: 'Status', nl: 'Status' },
    'Actions': { fr: 'Actions', de: 'Aktionen', nl: 'Acties' },
    'Action': { fr: 'Action', de: 'Aktion', nl: 'Actie' },
    'Edit': { fr: 'Modifier', de: 'Bearbeiten', nl: 'Bewerken' },
    'Delete': { fr: 'Supprimer', de: 'Löschen', nl: 'Verwijderen' },
    'No users found.': { fr: 'Aucun utilisateur trouvé.', de: 'Keine Benutzer gefunden.', nl: 'Geen gebruikers gevonden.' },
    'Add User': { fr: 'Ajouter un utilisateur', de: 'Benutzer hinzufügen', nl: 'Gebruiker toevoegen' },
    '➕ Add User': { fr: '➕ Ajouter un utilisateur', de: '➕ Benutzer hinzufügen', nl: '➕ Gebruiker toevoegen' },
    'Username is required.': { fr: "Le nom d’utilisateur est obligatoire.", de: 'Der Benutzername ist erforderlich.', nl: 'De gebruikersnaam is verplicht.' },
    'Valid email is required.': { fr: 'Une adresse e-mail valide est obligatoire.', de: 'Eine gültige E-Mail-Adresse ist erforderlich.', nl: 'Een geldig e-mailadres is verplicht.' },
    'Select role': { fr: 'Sélectionner un rôle', de: 'Rolle auswählen', nl: 'Rol selecteren' },
    'Admin': { fr: 'Administrateur', de: 'Administrator', nl: 'Beheerder' },
    'Operator': { fr: 'Opérateur', de: 'Bediener', nl: 'Operator' },
    'Supervisor': { fr: 'Superviseur', de: 'Supervisor', nl: 'Supervisor' },
    'Quality': { fr: 'Qualité', de: 'Qualität', nl: 'Kwaliteit' },
    'Role is required.': { fr: 'Le rôle est obligatoire.', de: 'Die Rolle ist erforderlich.', nl: 'De rol is verplicht.' },
    'Select language': { fr: 'Sélectionner une langue', de: 'Sprache auswählen', nl: 'Taal selecteren' },
    'French': { fr: 'Français', de: 'Französisch', nl: 'Frans' },
    'English': { fr: 'Anglais', de: 'Englisch', nl: 'Engels' },
    'Deutsch': { fr: 'Allemand', de: 'Deutsch', nl: 'Duits' },
    'Language is required.': { fr: 'La langue est obligatoire.', de: 'Die Sprache ist erforderlich.', nl: 'De taal is verplicht.' },
    'Loading countries...': { fr: 'Chargement des pays...', de: 'Länder werden geladen...', nl: 'Landen laden...' },
    'Phone number is required.': { fr: 'Le numéro de téléphone est obligatoire.', de: 'Die Telefonnummer ist erforderlich.', nl: 'Het telefoonnummer is verplicht.' },
    'Delete User': { fr: 'Supprimer l’utilisateur', de: 'Benutzer löschen', nl: 'Gebruiker verwijderen' },
    'This user will not be able to login until the account is reactivated.': { fr: 'Cet utilisateur ne pourra pas se connecter tant que le compte ne sera pas réactivé.', de: 'Dieser Benutzer kann sich erst nach der Reaktivierung des Kontos wieder anmelden.', nl: 'Deze gebruiker kan pas weer inloggen nadat het account is geactiveerd.' },
    'This action will remove the user account and cannot be undone.': { fr: 'Cette action supprimera le compte utilisateur et ne pourra pas être annulée.', de: 'Diese Aktion löscht das Benutzerkonto und kann nicht rückgängig gemacht werden.', nl: 'Deze actie verwijdert het gebruikersaccount en kan niet ongedaan worden gemaakt.' },
    'Verify Email': { fr: 'Vérifier l’e-mail', de: 'E-Mail bestätigen', nl: 'E-mail verifiëren' },
    'A verification code was sent to:': { fr: 'Un code de vérification a été envoyé à :', de: 'Ein Bestätigungscode wurde gesendet an:', nl: 'Een verificatiecode is verzonden naar:' },
    'Verification Code': { fr: 'Code de vérification', de: 'Bestätigungscode', nl: 'Verificatiecode' },
    'The code expires after 10 minutes.': { fr: 'Le code expire après 10 minutes.', de: 'Der Code läuft nach 10 Minuten ab.', nl: 'De code verloopt na 10 minuten.' },
    'OK': { fr: 'OK', de: 'OK', nl: 'OK' },
    'Close': { fr: 'Fermer', de: 'Schließen', nl: 'Sluiten' },
    'Phone Number': { fr: 'Numéro de téléphone', de: 'Telefonnummer', nl: 'Telefoonnummer' },
    'Enter 6-digit code': { fr: 'Saisir le code à 6 chiffres', de: '6-stelligen Code eingeben', nl: 'Voer de 6-cijferige code in' },

    'Admin Dashboard Overview': { fr: 'Vue d’ensemble du tableau de bord administrateur', de: 'Übersicht des Administrator-Dashboards', nl: 'Overzicht beheerdersdashboard' },
    'Loading dashboard statistics...': { fr: 'Chargement des statistiques du tableau de bord...', de: 'Dashboard-Statistiken werden geladen...', nl: 'Dashboardstatistieken laden...' },
    'Total Users': { fr: 'Total des utilisateurs', de: 'Benutzer insgesamt', nl: 'Totaal gebruikers' },
    'All registered accounts': { fr: 'Tous les comptes enregistrés', de: 'Alle registrierten Konten', nl: 'Alle geregistreerde accounts' },
    'Admins': { fr: 'Administrateurs', de: 'Administratoren', nl: 'Beheerders' },
    'Operators': { fr: 'Opérateurs', de: 'Bediener', nl: 'Operators' },
    'Supervisors': { fr: 'Superviseurs', de: 'Supervisoren', nl: 'Supervisors' },
    'Users by Role': { fr: 'Utilisateurs par rôle', de: 'Benutzer nach Rolle', nl: 'Gebruikers per rol' },
    'User Registration Over Time': { fr: 'Évolution des inscriptions', de: 'Benutzerregistrierungen im Zeitverlauf', nl: 'Gebruikersregistraties in de tijd' },
    'Non-Conformances by Status': { fr: 'Non-conformités par statut', de: 'Nichtkonformitäten nach Status', nl: 'Afwijkingen per status' },
    'Inventory by Stock Point': { fr: 'Stock par point de stockage', de: 'Bestand nach Lagerpunkt', nl: 'Voorraad per voorraadpunt' },
    'Operations Activity': { fr: 'Activité des opérations', de: 'Betriebsaktivität', nl: 'Operationele activiteit' },
    'Daily Completed Orders': { fr: 'Ordres terminés quotidiennement', de: 'Täglich abgeschlossene Aufträge', nl: 'Dagelijks voltooide orders' },
    'Registered Users': { fr: 'Utilisateurs enregistrés', de: 'Registrierte Benutzer', nl: 'Geregistreerde gebruikers' },
    'Loading users...': { fr: 'Chargement des utilisateurs...', de: 'Benutzer werden geladen...', nl: 'Gebruikers laden...' },
    'Language': { fr: 'Langue', de: 'Sprache', nl: 'Taal' },
    'Phone': { fr: 'Téléphone', de: 'Telefon', nl: 'Telefoon' },
    'Registered': { fr: 'Inscrit', de: 'Registriert', nl: 'Geregistreerd' },

    'Operator Dashboard': { fr: 'Tableau de bord opérateur', de: 'Bediener-Dashboard', nl: 'Operatordashboard' },
    'Start Next Operation': { fr: 'Démarrer l’opération suivante', de: 'Nächsten Vorgang starten', nl: 'Volgende bewerking starten' },
    'Active Operations': { fr: 'Opérations actives', de: 'Aktive Vorgänge', nl: 'Actieve bewerkingen' },
    'Currently assigned to you': { fr: 'Actuellement affectées à vous', de: 'Derzeit Ihnen zugewiesen', nl: 'Momenteel aan u toegewezen' },
    'Pending Dispatch': { fr: 'Lancements en attente', de: 'Ausstehende Freigaben', nl: 'Wachtende vrijgaven' },
    'Waiting to be started': { fr: 'En attente de démarrage', de: 'Warten auf Start', nl: 'Wachten om te starten' },
    'Completed Today': { fr: 'Terminées aujourd’hui', de: 'Heute abgeschlossen', nl: 'Vandaag voltooid' },
    'Finished operations': { fr: 'Opérations terminées', de: 'Abgeschlossene Vorgänge', nl: 'Voltooide bewerkingen' },
    'Reported NC': { fr: 'NC signalées', de: 'Gemeldete NK', nl: 'Gemelde afwijkingen' },
    'Quality issues reported': { fr: 'Problèmes qualité signalés', de: 'Gemeldete Qualitätsprobleme', nl: 'Gemelde kwaliteitsproblemen' },
    'Completed Operations This Week': { fr: 'Opérations terminées cette semaine', de: 'Diese Woche abgeschlossene Vorgänge', nl: 'Deze week voltooide bewerkingen' },
    'Operations by Status': { fr: 'Opérations par statut', de: 'Vorgänge nach Status', nl: 'Bewerkingen per status' },
    'NC Reported This Month': { fr: 'NC signalées ce mois-ci', de: 'Diesen Monat gemeldete NK', nl: 'Deze maand gemelde afwijkingen' },
    'My Active Operations': { fr: 'Mes opérations actives', de: 'Meine aktiven Vorgänge', nl: 'Mijn actieve bewerkingen' },
    'Operation': { fr: 'Opération', de: 'Vorgang', nl: 'Bewerking' },
    'Item Code': { fr: 'Code article', de: 'Artikelcode', nl: 'Artikelcode' },
    'Item Name': { fr: 'Nom de l’article', de: 'Artikelname', nl: 'Artikelnaam' },
    'Quantity': { fr: 'Quantité', de: 'Menge', nl: 'Aantal' },
    'Start Time': { fr: 'Heure de début', de: 'Startzeit', nl: 'Starttijd' },
    'Progress': { fr: 'Progression', de: 'Fortschritt', nl: 'Voortgang' },
    'View': { fr: 'Voir', de: 'Anzeigen', nl: 'Bekijken' },
    'Report Qty': { fr: 'Déclarer la quantité', de: 'Menge melden', nl: 'Aantal melden' },
    'Complete': { fr: 'Terminer', de: 'Abschließen', nl: 'Voltooien' },
    'Report NC': { fr: 'Signaler une NC', de: 'NK melden', nl: 'Afwijking melden' },
    'No active operations.': { fr: 'Aucune opération active.', de: 'Keine aktiven Vorgänge.', nl: 'Geen actieve bewerkingen.' },
    'Pending Dispatch List': { fr: 'Liste des lancements en attente', de: 'Liste ausstehender Freigaben', nl: 'Lijst met wachtende vrijgaven' },
    'Dispatch No': { fr: 'N° de lancement', de: 'Freigabe-Nr.', nl: 'Vrijgavenummer' },
    'Description': { fr: 'Description', de: 'Beschreibung', nl: 'Beschrijving' },
    'Priority': { fr: 'Priorité', de: 'Priorität', nl: 'Prioriteit' },
    'Start': { fr: 'Démarrer', de: 'Starten', nl: 'Starten' },
    'No pending dispatch orders.': { fr: 'Aucun ordre de lancement en attente.', de: 'Keine ausstehenden Freigabeaufträge.', nl: 'Geen wachtende vrijgaveorders.' },
    'Materials Status': { fr: 'État des matières', de: 'Materialstatus', nl: 'Materiaalstatus' },
    'Material': { fr: 'Matière', de: 'Material', nl: 'Materiaal' },
    'Required': { fr: 'Requis', de: 'Erforderlich', nl: 'Vereist' },
    'Available': { fr: 'Disponible', de: 'Verfügbar', nl: 'Beschikbaar' },
    'No material data available.': { fr: 'Aucune donnée matière disponible.', de: 'Keine Materialdaten verfügbar.', nl: 'Geen materiaalgegevens beschikbaar.' },
    'My Last Reported NC': { fr: 'Ma dernière NC signalée', de: 'Meine zuletzt gemeldete NK', nl: 'Mijn laatst gemelde afwijking' },
    'NC Number': { fr: 'Numéro de NC', de: 'NK-Nummer', nl: 'Afwijkingsnummer' },
    'Reason': { fr: 'Motif', de: 'Grund', nl: 'Reden' },
    'Date': { fr: 'Date', de: 'Datum', nl: 'Datum' },
    'No NC reported yet.': { fr: 'Aucune NC signalée pour le moment.', de: 'Noch keine NK gemeldet.', nl: 'Nog geen afwijking gemeld.' },
    'Quick Actions': { fr: 'Actions rapides', de: 'Schnellaktionen', nl: 'Snelle acties' },
    'Report Production Progress': { fr: 'Déclarer l’avancement de production', de: 'Produktionsfortschritt melden', nl: 'Productievoortgang melden' },
    'Report Non-Conformance': { fr: 'Signaler une non-conformité', de: 'Nichtkonformität melden', nl: 'Afwijking melden' },
    'Check Materials': { fr: 'Vérifier les matières', de: 'Materialien prüfen', nl: 'Materialen controleren' },
    'Report Completed Quantity': { fr: 'Déclarer la quantité terminée', de: 'Fertigmenge melden', nl: 'Voltooid aantal melden' },
    'Planned Qty': { fr: 'Qté planifiée', de: 'Geplante Menge', nl: 'Gepland aantal' },
    'Completed Qty': { fr: 'Qté terminée', de: 'Fertigmenge', nl: 'Voltooid aantal' },
    'Remaining Qty': { fr: 'Qté restante', de: 'Restmenge', nl: 'Resterend aantal' },
    'Current Progress': { fr: 'Progression actuelle', de: 'Aktueller Fortschritt', nl: 'Huidige voortgang' },
    'Quantity completed now': { fr: 'Quantité terminée maintenant', de: 'Jetzt fertiggestellte Menge', nl: 'Nu voltooid aantal' },
    'Confirm Quantity': { fr: 'Confirmer la quantité', de: 'Menge bestätigen', nl: 'Aantal bevestigen' },
    'Enter completed quantity': { fr: 'Saisir la quantité terminée', de: 'Fertigmenge eingeben', nl: 'Voer het voltooide aantal in' },

    'Previous': { fr: 'Précédent', de: 'Zurück', nl: 'Vorige' },
    'Next': { fr: 'Suivant', de: 'Weiter', nl: 'Volgende' },
    'Options': { fr: 'Options', de: 'Optionen', nl: 'Opties' },
    'Active Orders': { fr: 'Ordres actifs', de: 'Aktive Aufträge', nl: 'Actieve orders' },
    'Order': { fr: 'Ordre', de: 'Auftrag', nl: 'Order' },
    'Item': { fr: 'Article', de: 'Artikel', nl: 'Artikel' },
    'Machine Type': { fr: 'Type de machine', de: 'Maschinentyp', nl: 'Machinetype' },
    'Quantity Ordered': { fr: 'Quantité commandée', de: 'Bestellmenge', nl: 'Besteld aantal' },
    'Planned Start Date': { fr: 'Date de début planifiée', de: 'Geplantes Startdatum', nl: 'Geplande startdatum' },
    'Work Center': { fr: 'Centre de charge', de: 'Arbeitsplatz', nl: 'Werkcentrum' },
    'No active operations found for this user.': { fr: 'Aucune opération active trouvée pour cet utilisateur.', de: 'Keine aktiven Vorgänge für diesen Benutzer gefunden.', nl: 'Geen actieve bewerkingen voor deze gebruiker gevonden.' },
    'Filter by Order': { fr: 'Filtrer par ordre', de: 'Nach Auftrag filtern', nl: 'Filteren op order' },
    'Loading data ...': { fr: 'Chargement des données...', de: 'Daten werden geladen...', nl: 'Gegevens laden...' },
    'Loading data .......': { fr: 'Chargement des données...', de: 'Daten werden geladen...', nl: 'Gegevens laden...' },
    'Material Consumption': { fr: 'Consommation matière', de: 'Materialverbrauch', nl: 'Materiaalverbruik' },
    'Position': { fr: 'Position', de: 'Position', nl: 'Positie' },
    'Qty To Issue': { fr: 'Qté à sortir', de: 'Auszugebende Menge', nl: 'Uit te geven aantal' },
    'Issued Qty': { fr: 'Qté sortie', de: 'Ausgegebene Menge', nl: 'Uitgegeven aantal' },
    'Quarantined Qty': { fr: 'Qté en quarantaine', de: 'Quarantänemenge', nl: 'Aantal in quarantaine' },
    'Scrapped Qty': { fr: 'Qté rebutée', de: 'Ausschussmenge', nl: 'Afgekeurd aantal' },
    'Estimated Qty': { fr: 'Qté estimée', de: 'Geschätzte Menge', nl: 'Geschat aantal' },
    'Initiate': { fr: 'Lancer', de: 'Starten', nl: 'Starten' },
    'As Built': { fr: 'Tel que construit', de: 'Wie gebaut', nl: 'Zoals gebouwd' },
    'Quarantine': { fr: 'Quarantaine', de: 'Quarantäne', nl: 'Quarantaine' },
    'No material data found.': { fr: 'Aucune donnée matière trouvée.', de: 'Keine Materialdaten gefunden.', nl: 'Geen materiaalgegevens gevonden.' },
    'Filter by Item': { fr: 'Filtrer par article', de: 'Nach Artikel filtern', nl: 'Filteren op artikel' },
    'Raise Non Conformance': { fr: 'Créer une non-conformité', de: 'Nichtkonformität erfassen', nl: 'Afwijking registreren' },
    'NC Subject': { fr: 'Objet de la NC', de: 'NK-Betreff', nl: 'Onderwerp afwijking' },
    'Production Order No': { fr: 'N° ordre de production', de: 'Produktionsauftrags-Nr.', nl: 'Productieordernummer' },
    'Operation No': { fr: 'N° opération', de: 'Vorgangs-Nr.', nl: 'Bewerkingsnummer' },
    'Parent Item Code': { fr: 'Code article parent', de: 'Übergeordneter Artikelcode', nl: 'Code bovenliggend artikel' },
    'BOM Item': { fr: 'Article nomenclature', de: 'Stücklistenartikel', nl: 'BOM-artikel' },
    'Attachments': { fr: 'Pièces jointes', de: 'Anhänge', nl: 'Bijlagen' },
    'NC Description': { fr: 'Description de la NC', de: 'NK-Beschreibung', nl: 'Beschrijving afwijking' },
    'Enter NC Subject': { fr: 'Saisir l’objet de la NC', de: 'NK-Betreff eingeben', nl: 'Voer het onderwerp van de afwijking in' },
    'Enter Order No': { fr: 'Saisir le n° d’ordre', de: 'Auftragsnummer eingeben', nl: 'Voer het ordernummer in' },
    'Enter Operation No': { fr: 'Saisir le n° d’opération', de: 'Vorgangsnummer eingeben', nl: 'Voer het bewerkingsnummer in' },
    'Enter Item Code': { fr: 'Saisir le code article', de: 'Artikelcode eingeben', nl: 'Voer de artikelcode in' },
    'Enter Item Quantity': { fr: 'Saisir la quantité de l’article', de: 'Artikelmenge eingeben', nl: 'Voer het aantal artikelen in' },
    'Enter Description': { fr: 'Saisir une description', de: 'Beschreibung eingeben', nl: 'Voer een beschrijving in' },
    'Work instructions': { fr: 'Instructions de travail', de: 'Arbeitsanweisungen', nl: 'Werkinstructies' },
    'Order Details': { fr: 'Détails de l’ordre', de: 'Auftragsdetails', nl: 'Orderdetails' },
    'Machine :': { fr: 'Machine :', de: 'Maschine:', nl: 'Machine:' },
    'Time Left :': { fr: 'Temps restant :', de: 'Verbleibende Zeit:', nl: 'Resterende tijd:' },
    'Process Variables': { fr: 'Variables de procédé', de: 'Prozessvariablen', nl: 'Procesvariabelen' },
    'Non Conformances': { fr: 'Non-conformités', de: 'Nichtkonformitäten', nl: 'Afwijkingen' },
    'No related NCs found.': { fr: 'Aucune NC associée trouvée.', de: 'Keine zugehörigen NK gefunden.', nl: 'Geen gerelateerde afwijkingen gevonden.' },
    'Confirm completion of this operation ?': { fr: 'Confirmer la fin de cette opération ?', de: 'Abschluss dieses Vorgangs bestätigen?', nl: 'Voltooiing van deze bewerking bevestigen?' },
    'Confirm': { fr: 'Confirmer', de: 'Bestätigen', nl: 'Bevestigen' },

    'Origin Order': { fr: 'Ordre d’origine', de: 'Ursprungsauftrag', nl: 'Bronorder' },
    'Creation Date': { fr: 'Date de création', de: 'Erstellungsdatum', nl: 'Aanmaakdatum' },
    'No NC data available.': { fr: 'Aucune donnée NC disponible.', de: 'Keine NK-Daten verfügbar.', nl: 'Geen afwijkingsgegevens beschikbaar.' },

    'Edit Profile': { fr: 'Modifier le profil', de: 'Profil bearbeiten', nl: 'Profiel bewerken' },
    'Update your personal information and account security.': { fr: 'Mettez à jour vos informations personnelles et la sécurité de votre compte.', de: 'Aktualisieren Sie Ihre persönlichen Daten und die Kontosicherheit.', nl: 'Werk uw persoonlijke gegevens en accountbeveiliging bij.' },
    'No Image': { fr: 'Aucune image', de: 'Kein Bild', nl: 'Geen afbeelding' },
    'Profile Image': { fr: 'Photo de profil', de: 'Profilbild', nl: 'Profielfoto' },
    'Personal Information': { fr: 'Informations personnelles', de: 'Persönliche Daten', nl: 'Persoonlijke gegevens' },
    'Email cannot be changed.': { fr: 'L’adresse e-mail ne peut pas être modifiée.', de: 'Die E-Mail-Adresse kann nicht geändert werden.', nl: 'Het e-mailadres kan niet worden gewijzigd.' },
    'Countries are loaded automatically from an API. The saved value will be like +21612345678.': { fr: 'Les pays sont chargés automatiquement depuis une API. La valeur enregistrée sera au format +21612345678.', de: 'Länder werden automatisch über eine API geladen. Der gespeicherte Wert hat das Format +21612345678.', nl: 'Landen worden automatisch via een API geladen. De opgeslagen waarde heeft het formaat +21612345678.' },
    'Change Password': { fr: 'Changer le mot de passe', de: 'Passwort ändern', nl: 'Wachtwoord wijzigen' },
    'Leave these fields empty if you do not want to change your password.': { fr: 'Laissez ces champs vides pour ne pas modifier votre mot de passe.', de: 'Lassen Sie diese Felder leer, wenn Sie Ihr Passwort nicht ändern möchten.', nl: 'Laat deze velden leeg als u uw wachtwoord niet wilt wijzigen.' },
    'Old Password': { fr: 'Ancien mot de passe', de: 'Altes Passwort', nl: 'Oud wachtwoord' },
    'New Password': { fr: 'Nouveau mot de passe', de: 'Neues Passwort', nl: 'Nieuw wachtwoord' },
    'Confirm New Password': { fr: 'Confirmer le nouveau mot de passe', de: 'Neues Passwort bestätigen', nl: 'Nieuw wachtwoord bevestigen' },
    'Save Changes': { fr: 'Enregistrer les modifications', de: 'Änderungen speichern', nl: 'Wijzigingen opslaan' },
    'Processing...': { fr: 'Traitement...', de: 'Verarbeitung...', nl: 'Verwerken...' },
    'Verify Password Change': { fr: 'Vérifier le changement de mot de passe', de: 'Passwortänderung bestätigen', nl: 'Wachtwoordwijziging verifiëren' },
    'We sent a 6-digit verification code to:': { fr: 'Nous avons envoyé un code de vérification à 6 chiffres à :', de: 'Wir haben einen 6-stelligen Bestätigungscode gesendet an:', nl: 'We hebben een 6-cijferige verificatiecode verzonden naar:' },
    'Enter your username': { fr: "Saisissez votre nom d’utilisateur", de: 'Benutzernamen eingeben', nl: 'Voer uw gebruikersnaam in' },
    'Email cannot be modified': { fr: 'L’adresse e-mail ne peut pas être modifiée', de: 'Die E-Mail-Adresse kann nicht geändert werden', nl: 'Het e-mailadres kan niet worden gewijzigd' },
    'Enter your phone number': { fr: 'Saisissez votre numéro de téléphone', de: 'Telefonnummer eingeben', nl: 'Voer uw telefoonnummer in' },
    'Enter your old password': { fr: 'Saisissez votre ancien mot de passe', de: 'Altes Passwort eingeben', nl: 'Voer uw oude wachtwoord in' },
    'Enter your new password': { fr: 'Saisissez votre nouveau mot de passe', de: 'Neues Passwort eingeben', nl: 'Voer uw nieuwe wachtwoord in' },
    'Rewrite your new password': { fr: 'Ressaisissez votre nouveau mot de passe', de: 'Neues Passwort erneut eingeben', nl: 'Voer uw nieuwe wachtwoord opnieuw in' },

    'Forget Password': { fr: 'Mot de passe oublié', de: 'Passwort vergessen', nl: 'Wachtwoord vergeten' },
    'Enter your email address and we will send you a new password.': { fr: 'Saisissez votre adresse e-mail et nous vous enverrons un nouveau mot de passe.', de: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen ein neues Passwort.', nl: 'Voer uw e-mailadres in en we sturen u een nieuw wachtwoord.' },
    'Back to login': { fr: 'Retour à la connexion', de: 'Zurück zur Anmeldung', nl: 'Terug naar inloggen' },
    'Password Help': { fr: 'Aide pour le mot de passe', de: 'Passworthilfe', nl: 'Wachtwoordhulp' },
    'Enter the email linked to your account. A new password will be generated and sent to your inbox.': { fr: 'Saisissez l’adresse e-mail liée à votre compte. Un nouveau mot de passe sera généré et envoyé dans votre boîte de réception.', de: 'Geben Sie die mit Ihrem Konto verknüpfte E-Mail-Adresse ein. Ein neues Passwort wird erstellt und an Ihren Posteingang gesendet.', nl: 'Voer het e-mailadres van uw account in. Een nieuw wachtwoord wordt gegenereerd en naar uw inbox gestuurd.' },
    'Email address': { fr: 'Adresse e-mail', de: 'E-Mail-Adresse', nl: 'E-mailadres' },
    'Login': { fr: 'Connexion', de: 'Anmelden', nl: 'Inloggen' },
    'Sign In to your account': { fr: 'Connectez-vous à votre compte', de: 'Bei Ihrem Konto anmelden', nl: 'Log in op uw account' },
    'Forget password?': { fr: 'Mot de passe oublié ?', de: 'Passwort vergessen?', nl: 'Wachtwoord vergeten?' },
    'Welcome Back!': { fr: 'Bon retour !', de: 'Willkommen zurück!', nl: 'Welkom terug!' },
    'Please enter your credentials to log in. If you need help, contact the administrator.': { fr: 'Saisissez vos identifiants pour vous connecter. Pour obtenir de l’aide, contactez l’administrateur.', de: 'Geben Sie Ihre Zugangsdaten ein. Wenn Sie Hilfe benötigen, wenden Sie sich an den Administrator.', nl: 'Voer uw inloggegevens in. Neem contact op met de beheerder als u hulp nodig hebt.' },
    'Password': { fr: 'Mot de passe', de: 'Passwort', nl: 'Wachtwoord' },
    "Oops! You're lost.": { fr: 'Oups ! Vous êtes perdu.', de: 'Hoppla! Sie haben sich verirrt.', nl: 'Oeps! U bent verdwaald.' },
    'The page you are looking for was not found.': { fr: 'La page recherchée est introuvable.', de: 'Die gesuchte Seite wurde nicht gefunden.', nl: 'De pagina die u zoekt is niet gevonden.' },
    'Search': { fr: 'Rechercher', de: 'Suchen', nl: 'Zoeken' },
    'What are you looking for?': { fr: 'Que recherchez-vous ?', de: 'Wonach suchen Sie?', nl: 'Waar zoekt u naar?' },
    'Houston, we have a problem!': { fr: 'Houston, nous avons un problème !', de: 'Houston, wir haben ein Problem!', nl: 'Houston, we hebben een probleem!' },
    'The page you are looking for is temporarily unavailable.': { fr: 'La page recherchée est temporairement indisponible.', de: 'Die gesuchte Seite ist vorübergehend nicht verfügbar.', nl: 'De pagina die u zoekt is tijdelijk niet beschikbaar.' },
    'Register': { fr: 'S’inscrire', de: 'Registrieren', nl: 'Registreren' },
    'Create your account': { fr: 'Créez votre compte', de: 'Konto erstellen', nl: 'Maak uw account' },
    'Create Account': { fr: 'Créer un compte', de: 'Konto erstellen', nl: 'Account maken' },
    'Repeat password': { fr: 'Répéter le mot de passe', de: 'Passwort wiederholen', nl: 'Wachtwoord herhalen' },

    'Warehouse': { fr: 'Entrepôt', de: 'Lager', nl: 'Magazijn' },
    'Location': { fr: 'Emplacement', de: 'Standort', nl: 'Locatie' },
    'Inventory Date': { fr: 'Date d’inventaire', de: 'Inventurdatum', nl: 'Inventarisdatum' },
    'Inventory On Hand': { fr: 'Stock disponible', de: 'Lagerbestand', nl: 'Voorraad aanwezig' },
    'Inventory Blocked': { fr: 'Stock bloqué', de: 'Gesperrter Bestand', nl: 'Geblokkeerde voorraad' },
    'Inventory Allocated': { fr: 'Stock alloué', de: 'Zugewiesener Bestand', nl: 'Toegewezen voorraad' },
    'Inventory On Order': { fr: 'Stock commandé', de: 'Bestellbestand', nl: 'Voorraad in bestelling' },
    'Warehouse Master': { fr: 'Référentiel des entrepôts', de: 'Lagerstammdaten', nl: 'Magazijnstamgegevens' },
    'Matching Warehouses': { fr: 'Entrepôts correspondants', de: 'Passende Lager', nl: 'Overeenkomende magazijnen' },
    'Current Page': { fr: 'Page actuelle', de: 'Aktuelle Seite', nl: 'Huidige pagina' },
    'Search by Warehouse or Description': { fr: 'Rechercher par entrepôt ou description', de: 'Nach Lager oder Beschreibung suchen', nl: 'Zoeken op magazijn of beschrijving' },
    'Rows per page': { fr: 'Lignes par page', de: 'Zeilen pro Seite', nl: 'Rijen per pagina' },
    'Reset Filters': { fr: 'Réinitialiser les filtres', de: 'Filter zurücksetzen', nl: 'Filters resetten' },
    'Loading warehouses...': { fr: 'Chargement des entrepôts...', de: 'Lager werden geladen...', nl: 'Magazijnen laden...' },
    'Try again': { fr: 'Réessayer', de: 'Erneut versuchen', nl: 'Opnieuw proberen' },
    'No warehouses found matching the selected criteria.': { fr: 'Aucun entrepôt ne correspond aux critères sélectionnés.', de: 'Keine Lager entsprechen den ausgewählten Kriterien.', nl: 'Geen magazijnen gevonden die aan de geselecteerde criteria voldoen.' },
    'Use the search bar above': { fr: 'Utilisez la barre de recherche ci-dessus', de: 'Verwenden Sie die Suchleiste oben', nl: 'Gebruik de zoekbalk hierboven' },
    'Warehouse Type': { fr: 'Type d’entrepôt', de: 'Lagertyp', nl: 'Magazijntype' },
    'All': { fr: 'Tous', de: 'Alle', nl: 'Alle' },
    'MES Controlled': { fr: 'Géré par le MES', de: 'MES-gesteuert', nl: 'Door MES beheerd' },
    'Yes': { fr: 'Oui', de: 'Ja', nl: 'Ja' },
    'No': { fr: 'Non', de: 'Nein', nl: 'Nee' },
    'WMS Controlled': { fr: 'Géré par le WMS', de: 'WMS-gesteuert', nl: 'Door WMS beheerd' },

    'Admin Dashboard': { fr: 'Tableau de bord administrateur', de: 'Administrator-Dashboard', nl: 'Beheerdersdashboard' },
    'Quality Dashboard': { fr: 'Tableau de bord qualité', de: 'Qualitäts-Dashboard', nl: 'Kwaliteitsdashboard' },
    'Supervisor Dashboard': { fr: 'Tableau de bord superviseur', de: 'Supervisor-Dashboard', nl: 'Supervisordashboard' },
    'Manufacturing': { fr: 'Fabrication', de: 'Fertigung', nl: 'Productie' },
    'Dispatch List': { fr: 'Liste des lancements', de: 'Freigabeliste', nl: 'Vrijgavelijst' },
    'Active List': { fr: 'Liste active', de: 'Aktive Liste', nl: 'Actieve lijst' },
    'Non Conformances list': { fr: 'Liste des non-conformités', de: 'Liste der Nichtkonformitäten', nl: 'Lijst met afwijkingen' },
    'Raise Non-Conformance': { fr: 'Créer une non-conformité', de: 'Nichtkonformität erfassen', nl: 'Afwijking registreren' },
    'Warehousing': { fr: 'Entreposage', de: 'Lagerverwaltung', nl: 'Magazijnbeheer' },
    'Stock Point Inventory': { fr: 'Stock par point de stockage', de: 'Lagerpunktbestand', nl: 'Voorraad per voorraadpunt' },
    'Warehouses': { fr: 'Entrepôts', de: 'Lager', nl: 'Magazijnen' },
    'masterdata': { fr: 'Données de base', de: 'Stammdaten', nl: 'Stamgegevens' },
    'Product': { fr: 'Produit', de: 'Produkt', nl: 'Product' },
    'System': { fr: 'Système', de: 'System', nl: 'Systeem' },
    'Config': { fr: 'Configuration', de: 'Konfiguration', nl: 'Configuratie' },
    'Log': { fr: 'Journal', de: 'Protokoll', nl: 'Logboek' },
    'Users': { fr: 'Utilisateurs', de: 'Benutzer', nl: 'Gebruikers' },
    'Roles': { fr: 'Rôles', de: 'Rollen', nl: 'Rollen' },
    'Help': { fr: 'Aide', de: 'Hilfe', nl: 'Help' },
    'Documentation': { fr: 'Documentation', de: 'Dokumentation', nl: 'Documentatie' },

    'Inventory Management': { fr: 'Gestion des stocks', de: 'Bestandsverwaltung', nl: 'Voorraadbeheer' },
    'Enter a warehouse code or description': { fr: 'Saisir un code ou une description d’entrepôt', de: 'Lagercode oder Beschreibung eingeben', nl: 'Voer een magazijncode of beschrijving in' },
    'Clear search': { fr: 'Effacer la recherche', de: 'Suche löschen', nl: 'Zoekopdracht wissen' },
    'Traffic': { fr: 'Trafic', de: 'Datenverkehr', nl: 'Verkeer' },
    'Day': { fr: 'Jour', de: 'Tag', nl: 'Dag' },
    'Month': { fr: 'Mois', de: 'Monat', nl: 'Maand' },
    'Year': { fr: 'Année', de: 'Jahr', nl: 'Jaar' },
    'Visits': { fr: 'Visites', de: 'Besuche', nl: 'Bezoeken' },
    'Unique': { fr: 'Uniques', de: 'Eindeutig', nl: 'Uniek' },
    'Page views': { fr: 'Pages vues', de: 'Seitenaufrufe', nl: 'Paginaweergaven' },
    'New Users': { fr: 'Nouveaux utilisateurs', de: 'Neue Benutzer', nl: 'Nieuwe gebruikers' },
    'Bounce Rate': { fr: 'Taux de rebond', de: 'Absprungrate', nl: 'Bouncepercentage' },
    'New Clients': { fr: 'Nouveaux clients', de: 'Neue Kunden', nl: 'Nieuwe klanten' },
    'Recurring Clients': { fr: 'Clients récurrents', de: 'Wiederkehrende Kunden', nl: 'Terugkerende klanten' },
    'Monday': { fr: 'Lundi', de: 'Montag', nl: 'Maandag' },
    'Tuesday': { fr: 'Mardi', de: 'Dienstag', nl: 'Dinsdag' },
    'Wednesday': { fr: 'Mercredi', de: 'Mittwoch', nl: 'Woensdag' },
    'Thursday': { fr: 'Jeudi', de: 'Donnerstag', nl: 'Donderdag' },
    'Friday': { fr: 'Vendredi', de: 'Freitag', nl: 'Vrijdag' },
    'Saturday': { fr: 'Samedi', de: 'Samstag', nl: 'Zaterdag' },
    'Sunday': { fr: 'Dimanche', de: 'Sonntag', nl: 'Zondag' },
    'Male': { fr: 'Hommes', de: 'Männlich', nl: 'Man' },
    'Female': { fr: 'Femmes', de: 'Weiblich', nl: 'Vrouw' },
    'Download': { fr: 'Télécharger', de: 'Herunterladen', nl: 'Downloaden' },
    'Main chart': { fr: 'Graphique principal', de: 'Hauptdiagramm', nl: 'Hoofdgrafiek' },
    'CoreUI Logo': { fr: 'Logo CoreUI', de: 'CoreUI-Logo', nl: 'CoreUI-logo' },
    'Powered by Asma & Karim': { fr: 'Développé par Asma & Karim', de: 'Entwickelt von Asma & Karim', nl: 'Ontwikkeld door Asma & Karim' },

    'Session Expiring': { fr: 'Expiration de la session', de: 'Sitzung läuft ab', nl: 'Sessie verloopt' },
    'Your session will expire due to inactivity.': { fr: 'Votre session expirera en raison de votre inactivité.', de: 'Ihre Sitzung läuft wegen Inaktivität ab.', nl: 'Uw sessie verloopt wegens inactiviteit.' },
    'Click': { fr: 'Cliquez sur', de: 'Klicken Sie auf', nl: 'Klik op' },
    'Continue Session': { fr: 'Continuer la session', de: 'Sitzung fortsetzen', nl: 'Sessie voortzetten' },
    'to remain logged in.': { fr: 'pour rester connecté.', de: 'um angemeldet zu bleiben.', nl: 'om ingelogd te blijven.' },
    'Automatic logout in': { fr: 'Déconnexion automatique dans', de: 'Automatische Abmeldung in', nl: 'Automatisch uitloggen over' },
    'Toggle sidebar navigation': { fr: 'Afficher ou masquer la navigation latérale', de: 'Seitennavigation umschalten', nl: 'Zijbalknavigatie wisselen' },
    'Toggle sidebar fold': { fr: 'Réduire ou développer la barre latérale', de: 'Seitenleiste ein- oder ausklappen', nl: 'Zijbalk in- of uitklappen' },
    'Open user menu': { fr: 'Ouvrir le menu utilisateur', de: 'Benutzermenü öffnen', nl: 'Gebruikersmenu openen' },
    'Open theme picker': { fr: 'Ouvrir le sélecteur de thème', de: 'Themenauswahl öffnen', nl: 'Themakiezer openen' },
    'User avatar': { fr: 'Avatar utilisateur', de: 'Benutzeravatar', nl: 'Gebruikersavatar' },
  };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly translate: TranslateService,
    private readonly zone: NgZone,
  ) {}

  start(): void {
    if (this.started || typeof MutationObserver === 'undefined') {
      return;
    }
    this.started = true;

    this.languageSubscription = this.translate.onLangChange.subscribe(() => {
      queueMicrotask(() => this.refresh());
    });

    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver((mutations) => {
        const roots = new Set<Node>();
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' && mutation.target.parentNode) {
            roots.add(mutation.target.parentNode);
          }
          mutation.addedNodes.forEach((node) => roots.add(node));
        }
        roots.forEach((node) => this.translateTree(node));
      });

      this.observer.observe(this.document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    this.refresh();
  }

  refresh(): void {
    if (!this.document.body) {
      return;
    }
    this.translateTree(this.document.body);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.languageSubscription?.unsubscribe();
  }

  private translateTree(root: Node): void {
    const language = this.currentLanguage();

    if (root.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(root as Text, language);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
      return;
    }

    const element = root as Element;
    if (element.matches?.('script, style, code, pre, textarea, [data-no-auto-translate]')) {
      return;
    }

    if (element.nodeType === Node.ELEMENT_NODE) {
      this.translateAttributes(element, language);
    }

    const walker = this.document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : node as Element;
          return parent?.closest('script, style, code, pre, textarea, [data-no-auto-translate]')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let node: Node | null = walker.currentNode;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        this.translateTextNode(node as Text, language);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        this.translateAttributes(node as Element, language);
      }
      node = walker.nextNode();
    }
  }

  private translateTextNode(node: Text, language: SupportedLanguage): void {
    const current = node.nodeValue ?? '';
    const compact = this.compact(current);
    if (!compact || !/[A-Za-z]/.test(compact)) {
      return;
    }

    if (!this.originalText.has(node)) {
      this.originalText.set(node, current);
    }

    const original = this.originalText.get(node) ?? current;
    const translated = this.translateValue(original, language);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  private translateAttributes(element: Element, language: SupportedLanguage): void {
    const attributes = ['placeholder', 'title', 'aria-label', 'alt'];
    let originals = this.originalAttributes.get(element);
    if (!originals) {
      originals = new Map<string, string>();
      this.originalAttributes.set(element, originals);
    }

    for (const attribute of attributes) {
      const current = element.getAttribute(attribute);
      if (!current || !/[A-Za-z]/.test(current)) {
        continue;
      }
      if (!originals.has(attribute)) {
        originals.set(attribute, current);
      }
      const original = originals.get(attribute) ?? current;
      const translated = this.translateValue(original, language);
      if (current !== translated) {
        element.setAttribute(attribute, translated);
      }
    }
  }

  private translateValue(value: string, language: SupportedLanguage): string {
    if (language === 'en') {
      return value;
    }

    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    const compact = this.compact(value);

    const exact = this.exact[compact]?.[language];
    if (exact) {
      return `${leading}${exact}${trailing}`;
    }

    // Dynamic welcome sentence where the operator name is rendered by Angular.
    const welcome = compact.match(/^Welcome back, (.+)\. Here is your production workspace\.$/);
    if (welcome) {
      const name = welcome[1];
      const dynamic: TranslationSet = {
        fr: `Bon retour, ${name}. Voici votre espace de production.`,
        de: `Willkommen zurück, ${name}. Hier ist Ihr Produktionsarbeitsbereich.`,
        nl: `Welkom terug, ${name}. Dit is uw productieomgeving.`,
      };
      return `${leading}${dynamic[language]}${trailing}`;
    }

    const expiration = compact.match(/^This code expires in (.+) minutes\.$/);
    if (expiration) {
      const minutes = expiration[1];
      const dynamic: TranslationSet = {
        fr: `Ce code expire dans ${minutes} minutes.`,
        de: `Dieser Code läuft in ${minutes} Minuten ab.`,
        nl: `Deze code verloopt over ${minutes} minuten.`,
      };
      return `${leading}${dynamic[language]}${trailing}`;
    }

    return value;
  }

  private compact(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private currentLanguage(): SupportedLanguage {
    const language = (this.translate.currentLang || this.translate.getCurrentLang?.() || 'en') as SupportedLanguage;
    return ['en', 'fr', 'de', 'nl'].includes(language) ? language : 'en';
  }
}
