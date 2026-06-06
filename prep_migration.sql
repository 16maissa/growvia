UPDATE "AutomationPrefs" SET "mode" = 'libre' WHERE "mode" = 'guide';
UPDATE "AutomationPrefs" SET "mode" = 'semi-auto' WHERE "mode" = 'semi';
UPDATE "AgentTask" SET "status" = 'done' WHERE "status" = 'approved';
UPDATE "AgentTask" SET "status" = 'pending' WHERE "status" = 'waiting_dependency';
