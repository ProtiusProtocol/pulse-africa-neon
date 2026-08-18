UPDATE public.markets SET researched_outcome = v.o, researched_source = v.s
FROM (VALUES
  ('PSL2526PiratesTop2','YES','Orlando Pirates won the 2025-26 Betway Premiership (69 pts) — psl.co.za'),
  ('PSL2526ChiefsTop3','YES','Kaizer Chiefs finished 3rd (54 pts) — soccerstats/footballinfo final table'),
  ('PSL2526SundownsTopGoalDiff','NO','Pirates had the best GD (+46) vs Sundowns (+36) — final table'),
  ('PSL2526SundownsWin10PlusPoints','NO','Sundowns finished 2nd, 1 pt behind Pirates — psl.co.za'),
  ('PSL2526SixPlusWinStreak','YES','Orlando Pirates recorded an 8-match winning streak — Opta Jabu'),
  ('PSL2526Mofokeng5PlusGoals','YES','Relebohile Mofokeng recorded 10 league goals in 2025-26 — FotMob'),
  ('PSL2526Relegated2PlusMatchesLeft','NO','Relegation only settled on the final matchday and the 13 Jun 2026 playoff — TimesLIVE'),
  ('PSL2526CoachDismissed','YES','Durban City parted with Gavin Hunt (Dec 2025); TS Galaxy with Adnan Beganovic (Apr 2026)'),
  ('PSL2627VARIntroduced','NO','SAFA confirmed July 2026 that VAR is not ready for the 2026-27 season — TimesLIVE/News24')
) AS v(ref,o,s)
WHERE public.markets.outcome_ref = v.ref AND public.markets.resolved_outcome IS NULL;