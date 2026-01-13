(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});

  const patterns = {
    urgency: [
      /\bends? in\b/i,
      /\bdeal ends\b/i,
      /\bflash sale\b/i,
      /\blimited time\b/i,
      /\btime left\b/i,
      /\bending soon\b/i
    ],
    scarcity: [
      /\bonly \d+ left\b/i,
      /\b\d+ left in stock\b/i,
      /\blow stock\b/i,
      /\blimited stock\b/i,
      /\bselling fast\b/i,
      /\blimited quantity\b/i
    ],
    socialProof: [
      /\b\d+ people (are )?(viewing|watching)\b/i,
      /\b\d+ bought in the last\b/i,
      /\bjust bought\b/i,
      /\btrending now\b/i,
      /\bpopular choice\b/i
    ],
    nagOverlay: [
      /\bwait!\b/i,
      /\bbefore you go\b/i,
      /\bdon't leave\b/i,
      /\bspin the wheel\b/i,
      /\bexclusive offer\b/i,
      /\bunlock .*%\b/i
    ],
    forcedAddon: [
      /\bprotect(ion)?\b/i,
      /\bwarranty\b/i,
      /\badd-?on\b/i,
      /\bupgrade\b/i,
      /\bshipping insurance\b/i,
      /\bgift wrap\b/i
    ],
    fakeChat: [
      /\blive chat\b/i,
      /\bfrom support\b/i,
      /\bneed help\?\b/i,
      /\bchat with\b/i,
      /\bi'?m here to help\b/i
    ],
    buyCta: [
      /\badd to cart\b/i,
      /\badd to bag\b/i,
      /\badd to basket\b/i,
      /\bcheckout\b/i,
      /\bbuy now\b/i,
      /\bpurchase\b/i
    ]
  };

  const timerPattern = /\b\d{1,2}:\d{2}(:\d{2})?\b/;

  content.patterns = patterns;
  content.timerPattern = timerPattern;
})();
