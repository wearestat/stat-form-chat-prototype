<script>
 import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
 import { Button } from "$lib/components/ui/button/index.js";
</script>

<div class="flex h-screen items-center justify-center">
 <div class="flex gap-2">
  <Button variant="outline">Button</Button>
  <Button variant="outline" size="icon" aria-label="Submit">
   <ArrowUpIcon />
  </Button>
 </div>
</div>