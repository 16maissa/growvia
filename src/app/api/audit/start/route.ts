import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// n8n can be slow due to Apify scraping — 5 minute timeout
const N8N_TIMEOUT_MS = 5 * 60 * 1000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function getValidParsedJson(rawText: string): any {
  let text = rawText.replace(/```json|```/g, "").trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {}

  // Backtrack character by character to find the last syntactically valid JSON prefix
  for (let len = text.length; len > 0; len--) {
    const subText = text.substring(0, len).trim();
    let inString = false;
    let isEscaped = false;
    const stack: string[] = [];

    for (let i = 0; i < subText.length; i++) {
      const char = subText[i];
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === "\\") {
        isEscaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "{" || char === "[") {
          stack.push(char);
        } else if (char === "}") {
          if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
        } else if (char === "]") {
          if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
        }
      }
    }

    let repaired = subText;
    if (inString) repaired += '"';

    for (let j = stack.length - 1; j >= 0; j--) {
      if (stack[j] === "{") repaired += "}";
      else if (stack[j] === "[") repaired += "]";
    }

    try {
      return JSON.parse(repaired);
    } catch (err) {
      // Keep backtracking
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      plan,
      instagram_handle,
      niche,
      main_offer,
      price_range,
      target_audience,
      main_goal,
    } = await req.json();

    if (!instagram_handle) {
      return NextResponse.json({ error: "Le pseudo Instagram est requis." }, { status: 400 });
    }

    // 1. Sauvegarder les données dans UserProfile
    await prisma.userProfile.update({
      where: { userId: session.userId },
      data: {
        instagram_handle,
        niche,
        main_offer,
        price_range,
        target_audience,
        main_goal,
        plan: plan || "croissance",
        setup_done: true,
      },
    });

    // Update AutomationPrefs mode based on plan
    if (plan === "autopilote") {
      await prisma.automationPrefs.update({
        where: { userId: session.userId },
        data: { mode: "semi_auto" },
      });
    } else if (plan === "croissance") {
      await prisma.automationPrefs.update({
        where: { userId: session.userId },
        data: { mode: "libre" },
      });
    }

    // 2. Appeler le webhook n8n
    const webhookUrl = process.env.N8N_WEBHOOK_AUDIT;
    let n8nData: any = null;

    if (webhookUrl) {
      try {
        const n8nRes = await fetchWithTimeout(
          webhookUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instagram_handle,
              niche,
              main_offer,
              price_range,
              target_audience,
              main_goal,
              user_id: session.userId,
            }),
          },
          N8N_TIMEOUT_MS
        );

        if (!n8nRes.ok) {
          const errText = await n8nRes.text();
          throw new Error(`n8n a retourné une erreur (${n8nRes.status}): ${errText.slice(0, 200)}`);
        }

        const rawText = await n8nRes.text();
        try {
          n8nData = JSON.parse(rawText);
          // n8n sometimes wraps response in an array
          if (Array.isArray(n8nData)) n8nData = n8nData[0];
        } catch {
          throw new Error("Réponse n8n invalide (JSON malformé). Vérifiez le workflow.");
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === "AbortError") {
          return NextResponse.json(
            { error: "L'audit a dépassé le délai d'attente (5 min). Réessayez ou vérifiez le statut d'Apify." },
            { status: 504 }
          );
        }
        throw fetchErr;
      }
    } else {
      // Dev mock — matches the expected n8n response structure
      console.warn("N8N_WEBHOOK_AUDIT not set — using mock data");
      n8nData = {
        input: { instagram_handle, niche, main_offer, price_range, target_audience, main_goal },
        profile: {
          username: instagram_handle,
          full_name: "Utilisateur Test",
          biography: "Compte de test pour le développement.",
          followers: 1200,
          following: 350,
          posts_count: 48,
          is_verified: false,
          external_link: "",
        },
        metrics: {
          engagement_rate: 3.4,
          reach_ratio: 12.5,
          save_rate: 1.8,
          posting_frequency: "3x/semaine",
          reel_ratio: 0.6,
          bio_clicks: 45,
        },
        audience: {
          primary_age_range: "25-34",
          top_gender: "Femme (62%)",
          top_locations: ["France", "Belgique", "Suisse"],
        },
        audit_score: 67,
        plan_type: "optimisation",
        account_size: "micro",
        errors: [
          {
            title: "Fréquence de publication irrégulière",
            impact_on_sales: "Perte de 30% d'engagement",
            recommendation: "Publiez 5x/semaine avec au moins 3 Reels.",
            severity: "HIGH",
          },
          {
            title: "Bio non optimisée (pas de CTA)",
            impact_on_sales: "Zéro clic en lien bio",
            recommendation: "Ajoutez un lien Linktree avec une offre.",
            severity: "MEDIUM",
          },
        ],
        audit_summary: {
          strengths: ["Bon taux de sauvegarde", "Contenu authentique"],
          weaknesses: ["Pas de Reels", "Bio faible"],
          opportunities: ["Collaborations micro-influenceurs"],
        },
        revenue_estimation: {
          monthly_leads: 25,
          monthly_sales: 4,
          monthly_revenue_eur: 3200,
          conversion_rate: 0.16,
        },
        ai_report: {
          mois_1: [
            {
              semaine: 1,
              actions: [
                { day_of_week: "lundi", content_type: "reel", topic: "Présentation de votre méthode", cta: "Abonnez-vous pour la suite", optimal_hour: "18h" },
                { day_of_week: "mercredi", content_type: "carousel", topic: "3 erreurs qui freinent vos ventes", cta: "Enregistrez ce post", optimal_hour: "12h" },
              ],
            },
            {
              semaine: 2,
              actions: [
                { day_of_week: "lundi", content_type: "reel", topic: "Témoignage client (avant/après)", cta: "Lien en bio pour vous inscrire", optimal_hour: "18h" },
                { day_of_week: "jeudi", content_type: "quiz", topic: "Testez vos connaissances sur votre niche", cta: "Partagez vos résultats", optimal_hour: "19h" },
              ],
            },
          ],
          mois_2: [
            {
              semaine: 5,
              actions: [
                { day_of_week: "mardi", content_type: "reel", topic: "Coulisses de votre activité", cta: "Posez vos questions en commentaire", optimal_hour: "17h" },
              ],
            },
          ],
          mois_3: [
            {
              semaine: 9,
              actions: [
                { day_of_week: "lundi", content_type: "reel", topic: "Résultats après 90 jours", cta: "Lien en bio pour rejoindre le programme", optimal_hour: "18h" },
              ],
            },
          ],
        },
      };
    }

    // 3. Créer l'enregistrement Audit complet
    const aiReportData = {
      ...(n8nData.ai_report || {}),
      plan_display: n8nData.plan_display || null,
      audit_summary: n8nData.audit_summary || null,
      account_size: n8nData.account_size || null,
    };

    const audit = await prisma.audit.create({
      data: {
        userId: session.userId,
        score: n8nData.audit_score ?? n8nData.audit_summary?.score ?? null,
        plan_type: n8nData.plan_type ?? n8nData.audit_summary?.plan_type ?? null,
        errors_json: n8nData.errors ?? [],
        metrics_json: n8nData.metrics ?? {},
        audience_json: n8nData.audience ?? {},
        profile_json: n8nData.profile ?? {},
        revenue_estimation_json: n8nData.revenue_estimation ?? {},
        ai_report_json: aiReportData,
      },
    });

    // 4. Parser le plan 90J et créer les ActionPlans
    let actionPlansCreated = 0;

    try {
      let aiReport = n8nData.ai_report;

      // Si le plan est marqué comme tronqué, ou si c'est un objet vide/incomplet, on essaie de le réparer depuis le texte brut
      if (aiReport?.error || !aiReport || Object.keys(aiReport).length <= 2) {
        const rawContent = n8nData.plan_display?.content;
        if (typeof rawContent === "string" && rawContent) {
          console.log("Attempting to repair truncated JSON from plan_display.content...");
          const repaired = getValidParsedJson(rawContent);
          if (repaired && Object.keys(repaired).length > 2) {
            aiReport = repaired;
            console.log("Successfully repaired truncated JSON!");
            
            // On met à jour aiReportData pour qu'il contienne l'objet réparé en base
            // afin que le frontend n'affiche plus "JSON tronqué" dans le rapport IA
            aiReportData.ai_report = repaired;
            aiReportData.error = false;
            aiReportData.message = undefined;
            if (aiReportData.plan_display) {
              aiReportData.plan_display.type = "structured_plan";
              aiReportData.plan_display.content = repaired;
            }
            
            // On met également à jour l'audit créé précédemment avec les données réparées
            await prisma.audit.update({
              where: { id: audit.id },
              data: {
                ai_report_json: aiReportData
              }
            });
          }
        }
      }
      
      if (!aiReport) throw new Error('ai_report absent');

      // Collecter toutes les actions des 3 mois
      const allActions: Array<{
        week_number: number;
        day_of_week: string;
        content_type: string;
        topic: string;
        cta: string;
        optimal_hour: string;
      }> = [];

      // Détecter et parser le nouveau format simplifié (aiReport.tasks[])
      if (Array.isArray(aiReport.tasks)) {
        console.log(`Parsing new format tasks... Found ${aiReport.tasks.length} tasks.`);
        for (const t of aiReport.tasks) {
          // Extraire l'action / le titre / la description de manière extrêmement robuste
          let topicText = "Tâche à réaliser";
          if (t.action) {
            topicText = t.action;
          } else if (t.title && t.description) {
            topicText = `${t.title}: ${t.description}`;
          } else {
            topicText = t.title || t.description || "Sujet à définir";
          }

          // Déterminer la valeur du jour
          let dayVal = "Jour 1";
          if (t.day != null) {
            const rawDay = String(t.day).trim();
            dayVal = rawDay.startsWith("Jour") ? rawDay : `Jour ${rawDay}`;
          }

          allActions.push({
            week_number: Number(t.week || 1),
            day_of_week: dayVal,
            content_type: t.type || t.content_type || "Reel",
            topic: topicText,
            cta: t.cta || t.call_to_action || "",
            optimal_hour: t.priority || t.optimal_hour || "high",
          });
        }
      } else {
        // Supporter l'ancien format mois_1 / mois_2 / mois_3 ET mois1 / mois2 / mois3
        for (let m = 1; m <= 3; m++) {
          const moisKey = aiReport[`mois_${m}`] || aiReport[`mois${m}`] || aiReport[`month_${m}`];
          if (!moisKey) continue;

          // Gérer le cas où mois_X est directement un tableau de semaines
          const semaines = Array.isArray(moisKey) ? moisKey : (moisKey.semaines || moisKey.weeks || []);
          
          for (const semaine of semaines) {
            const weekNumber = semaine.semaine || semaine.week || semaine.week_number || m * 4 - 3;
            const actions = semaine.actions || semaine.tasks || [];

            for (const action of actions) {
              allActions.push({
                week_number: Number(weekNumber),
                day_of_week: action.jour || action.day || action.day_of_week || 'Lundi',
                content_type: action.type || action.content_type || 'Reel',
                topic: action.sujet || action.topic || action.action || 'Sujet à définir',
                cta: action.cta || action.call_to_action || '',
                optimal_hour: action.heure || action.heure_optimale || action.optimal_hour || '19h',
              });
            }
          }
        }
      }

      if (allActions.length === 0) {
        throw new Error(`Aucune action trouvée. Clés disponibles: ${Object.keys(aiReport).join(', ')}`);
      }

      // Créer tous les ActionPlan en base
      await prisma.actionPlan.createMany({
        data: allActions.map(a => ({
          auditId: audit.id,
          week_number: a.week_number,
          day_of_week: a.day_of_week,
          content_type: a.content_type,
          topic: a.topic,
          cta: a.cta || null,
          optimal_hour: a.optimal_hour,
          status: 'pending',
        })),
      });

      actionPlansCreated = allActions.length;
      console.log(`✅ ${actionPlansCreated} ActionPlans créés pour l'audit ${audit.id}`);

    } catch (error) {
      console.error('❌ ActionPlan parsing failed:', error);
      console.error('ai_report structure received:', JSON.stringify(n8nData.ai_report, null, 2)?.slice(0, 2000));
    }

    return NextResponse.json({ success: true, auditId: audit.id });
  } catch (error: any) {
    console.error("Audit API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
